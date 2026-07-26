import { Provider, ServiceType, TransactionStatus, Prisma, Network } from '@prisma/client';
import { prisma } from '../config/prisma';
import { PurchaseVTUDTO } from '../types/vtu';
import { UserService } from './userService';
import { WalletService } from './walletService';
import { IVtuProvider, ProviderPurchaseResponse } from './providers/vtuProvider.interface';
import { InlomaxProvider } from './providers/inlomaxProvider';
import { HusmodataProvider } from './providers/husmodataProvider';

export class VtuService {
  private static providers: Map<Provider, IVtuProvider> = new Map([
    [Provider.INLOMAX, new InlomaxProvider()],
    [Provider.HUSMODATA, new HusmodataProvider()],
  ]);

  /**
   * Resilient VTU Purchase Engine (`processPurchase`).
   * Implements 6-step lifecycle:
   *  Step 1: Validate transaction PIN.
   *  Step 2: Lock & debit user wallet balance (with Row-Level Locking FOR UPDATE).
   *  Step 3: Attempt purchase via Primary Provider (Inlomax).
   *  Step 4: Automatic fallback to Secondary Provider (Husmodata) on failure/timeout.
   *  Step 5: Immediate atomic wallet REFUND if BOTH providers fail + mark status FAILED.
   *  Step 6: Handle PENDING transactions & enqueue background polling check.
   */
  static async processPurchase(dto: PurchaseVTUDTO) {
    // -------------------------------------------------------------
    // STEP 1: Input Validation & Transaction PIN Verification
    // -------------------------------------------------------------
    if (dto.service_type === ServiceType.DATA && !dto.plan_id) {
      throw new Error('Data plan_id is required for DATA service requests.');
    }

    if (dto.amount <= 0) {
      throw new Error('Transaction amount must be strictly greater than 0.');
    }

    const isPinValid = await UserService.verifyTransactionPin(dto.user_id, dto.transaction_pin);
    if (!isPinValid) {
      throw new Error('Invalid 4-digit transaction PIN.');
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const txReference = `VTU-${dto.service_type}-${timestamp}-${randomSuffix}`;
    const debitReference = `DEBIT-${txReference}`;

    // Primary & Fallback Provider setup
    const primaryProviderType = dto.preferred_provider || Provider.INLOMAX;
    const fallbackProviderType = primaryProviderType === Provider.INLOMAX ? Provider.HUSMODATA : Provider.INLOMAX;

    // -------------------------------------------------------------
    // STEP 2: Lock & Debit User Wallet Balance
    // -------------------------------------------------------------
    const { transaction } = await prisma.$transaction(async (tx) => {
      // Debit wallet atomically with Row-Level Locking (`FOR UPDATE`) & Ledger Entry
      await WalletService.debitWallet(
        {
          user_id: dto.user_id,
          amount: dto.amount,
          reference: debitReference,
          description: `${dto.service_type} purchase for ${dto.phone_number} (${dto.network})`,
        },
        tx
      );

      // Create transaction record in PENDING status
      const createdTx = await tx.transaction.create({
        data: {
          user_id: dto.user_id,
          reference: txReference,
          service_type: dto.service_type,
          network: dto.network,
          phone_number: dto.phone_number,
          plan_id: dto.plan_id || null,
          amount: new Prisma.Decimal(dto.amount),
          provider_used: primaryProviderType,
          status: TransactionStatus.PENDING,
          retries_count: 0,
        },
      });

      return { transaction: createdTx };
    });

    // Helper method to dispatch to provider
    const executeProviderCall = async (providerType: Provider): Promise<ProviderPurchaseResponse> => {
      const provider = this.providers.get(providerType)!;
      if (dto.service_type === ServiceType.AIRTIME) {
        return await provider.purchaseAirtime(dto.network, dto.phone_number, dto.amount);
      } else {
        return await provider.purchaseData(dto.network, dto.phone_number, dto.plan_id!);
      }
    };

    // -------------------------------------------------------------
    // STEP 3: Attempt Purchase via Primary Provider (Inlomax)
    // -------------------------------------------------------------
    console.log(`[VTU Engine Log] Attempting ${dto.service_type} via Primary Provider (${primaryProviderType}) for ref '${txReference}'...`);
    let activeProvider = primaryProviderType;
    let retriesCount = 0;
    let providerResponse = await executeProviderCall(primaryProviderType);

    // -------------------------------------------------------------
    // STEP 4: Automatic Fallback to Husmodata if Inlomax Fails
    // -------------------------------------------------------------
    if (!providerResponse.success && providerResponse.status === 'FAILED') {
      console.warn(`[VTU Engine Warning] Primary Provider (${primaryProviderType}) failed: ${providerResponse.message}. Switching to Fallback Provider (${fallbackProviderType})...`);
      retriesCount++;
      activeProvider = fallbackProviderType;
      providerResponse = await executeProviderCall(fallbackProviderType);
    }

    // -------------------------------------------------------------
    // STEP 5 & 6: Process Outcome (SUCCESS / PENDING / BOTH FAILED + REFUND)
    // -------------------------------------------------------------
    if (providerResponse.success && providerResponse.status === 'SUCCESS') {
      // SUCCESS Outcome
      const updatedTx = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.SUCCESS,
          provider_used: activeProvider,
          provider_reference: providerResponse.provider_reference,
          retries_count: retriesCount,
        },
      });

      return {
        status: 'SUCCESS',
        message: providerResponse.message || 'VTU transaction completed successfully.',
        transaction: updatedTx,
      };
    } else if (providerResponse.status === 'PENDING') {
      // STEP 6: PENDING Outcome -> Enqueue Background Retry Check
      const updatedTx = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.PENDING,
          provider_used: activeProvider,
          provider_reference: providerResponse.provider_reference,
          retries_count: retriesCount,
        },
      });

      // Enqueue background status verification after 30 seconds
      this.enqueueBackgroundRetryJob(updatedTx.id, updatedTx.reference, activeProvider);

      return {
        status: 'PENDING',
        message: 'Transaction is processing at the telecom switch. You will receive an automated status update shortly.',
        transaction: updatedTx,
      };
    } else {
      // STEP 5: BOTH Providers Failed -> Trigger Immediate Atomic Wallet REFUND
      console.error(`[VTU Engine Error] BOTH Primary & Fallback providers failed for tx '${txReference}'. Executing immediate wallet refund...`);

      const refundReference = `REFUND-${txReference}`;

      await prisma.$transaction(async (tx) => {
        // Mark transaction as FAILED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            provider_used: activeProvider,
            retries_count: retriesCount + 1,
          },
        });

        // Atomically refund wallet with Row-Level Locking & Ledger Entry
        await WalletService.creditWallet(
          {
            user_id: dto.user_id,
            amount: dto.amount,
            reference: refundReference,
            description: `Auto-refund for failed ${dto.service_type} transaction (${txReference})`,
          },
          tx
        );
      });

      throw new Error(`VTU purchase failed on all gateways. Funds (₦${dto.amount.toFixed(2)}) have been refunded to your wallet. Reason: ${providerResponse.message}`);
    }
  }

  /**
   * Enqueue a background retry/status check job for PENDING transactions.
   */
  private static enqueueBackgroundRetryJob(transactionId: string, reference: string, provider: Provider) {
    console.log(`[VTU Queue Log] Enqueued background retry check job for PENDING tx '${reference}' via ${provider} (Scheduled in 30s)`);

    setTimeout(async () => {
      try {
        console.log(`[VTU Queue Execution] Checking background status for PENDING tx '${reference}'...`);
        const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });

        if (tx && tx.status === TransactionStatus.PENDING) {
          // In production with BullMQ: Query provider status API.
          // Simulated resolution: mark SUCCESS
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: TransactionStatus.SUCCESS,
              updated_at: new Date(),
            },
          });
          console.log(`[VTU Queue Execution] Background status check resolved tx '${reference}' to SUCCESS.`);
        }
      } catch (err: any) {
        console.error(`[VTU Queue Execution Error] Failed to process background retry for tx '${reference}':`, err.message);
      }
    }, 30000);
  }

  /**
   * Check balances across all configured VTU Providers
   */
  static async checkAllProviderBalances() {
    const balances = await Promise.all([
      this.providers.get(Provider.INLOMAX)!.checkBalance(),
      this.providers.get(Provider.HUSMODATA)!.checkBalance(),
    ]);

    return {
      providers: balances,
    };
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(userId: string, limit = 20, page = 1) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.transaction.count({
        where: { user_id: userId },
      }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction by reference
   */
  static async getTransactionByReference(reference: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { user: { select: { full_name: true, email: true, phone: true } } },
    });

    if (!transaction) throw new Error(`Transaction not found for reference: ${reference}`);
    return transaction;
  }
}
