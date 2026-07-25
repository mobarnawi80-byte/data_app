import { Provider, ServiceType, TransactionStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { PurchaseVTUDTO } from '../types/vtu';
import { UserService } from './userService';
import { WalletService } from './walletService';
import { IVTUProvider } from './providers/vtuProvider.interface';
import { InlomaxProvider } from './providers/inlomaxProvider';
import { HusmodataProvider } from './providers/husmodataProvider';

export class VTUService {
  private static providers: Map<Provider, IVTUProvider> = new Map([
    [Provider.INLOMAX, new InlomaxProvider()],
    [Provider.HUSMODATA, new HusmodataProvider()],
  ]);

  /**
   * Orchestrates complete VTU Purchase (Airtime or Data).
   * Ensures PIN security, wallet debiting, provider execution, and auto-refund on provider failure.
   */
  static async processVTUPurchase(dto: PurchaseVTUDTO) {
    // 1. Validate Input Data Requirements
    if (dto.service_type === ServiceType.DATA && !dto.plan_id) {
      throw new Error('Data plan_id is required for DATA service type.');
    }

    if (dto.amount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    // 2. Validate User Transaction PIN
    const isPinValid = await UserService.verifyTransactionPin(dto.user_id, dto.transaction_pin);
    if (!isPinValid) {
      throw new Error('Invalid 4-digit transaction PIN.');
    }

    // 3. Generate unique transaction reference
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const txReference = `VTU-${dto.service_type}-${timestamp}-${randomSuffix}`;
    const debitReference = `DEBIT-${txReference}`;

    // Select primary provider & fallback provider
    const primaryProviderType = dto.preferred_provider || Provider.INLOMAX;
    const fallbackProviderType = primaryProviderType === Provider.INLOMAX ? Provider.HUSMODATA : Provider.INLOMAX;

    // 4. STEP 1: Atomically debit user wallet & create PENDING transaction
    const { transaction } = await prisma.$transaction(async (tx) => {
      // Debit wallet first (will throw if insufficient funds)
      await WalletService.debitWallet(
        {
          user_id: dto.user_id,
          amount: dto.amount,
          reference: debitReference,
          description: `${dto.service_type} purchase for ${dto.phone_number} (${dto.network})`,
        },
        tx
      );

      // Create transaction in PENDING state
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

    // 5. STEP 2: Call Primary Provider
    const primaryProvider = this.providers.get(primaryProviderType)!;
    const providerRequest = {
      reference: txReference,
      service_type: dto.service_type,
      network: dto.network,
      phone_number: dto.phone_number,
      plan_id: dto.plan_id,
      amount: dto.amount,
    };

    let providerResponse = dto.service_type === ServiceType.AIRTIME
      ? await primaryProvider.purchaseAirtime(providerRequest)
      : await primaryProvider.purchaseData(providerRequest);

    let activeProviderUsed = primaryProviderType;
    let retriesCount = 0;

    // Fallback attempt if primary provider fails
    if (!providerResponse.success) {
      retriesCount++;
      const fallbackProvider = this.providers.get(fallbackProviderType)!;
      activeProviderUsed = fallbackProviderType;

      providerResponse = dto.service_type === ServiceType.AIRTIME
        ? await fallbackProvider.purchaseAirtime(providerRequest)
        : await fallbackProvider.purchaseData(providerRequest);
    }

    // 6. STEP 3: Handle Result (SUCCESS vs FAILED + AUTO REFUND)
    if (providerResponse.success) {
      // Mark transaction SUCCESS
      const updatedTx = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.SUCCESS,
          provider_used: activeProviderUsed,
          provider_reference: providerResponse.provider_reference,
          retries_count: retriesCount,
        },
      });

      return {
        status: 'SUCCESS',
        message: providerResponse.message || 'VTU transaction completed successfully.',
        transaction: updatedTx,
      };
    } else {
      // STEP 4: Provider Failed after fallback -> Mark FAILED & Refund Wallet
      const refundReference = `REFUND-${txReference}`;

      await prisma.$transaction(async (tx) => {
        // Mark transaction as FAILED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            provider_used: activeProviderUsed,
            retries_count: retriesCount + 1,
          },
        });

        // Credit money back to user wallet
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

      throw new Error(`VTU transaction failed. Funds (₦${dto.amount.toFixed(2)}) have been refunded to your wallet. Reason: ${providerResponse.message}`);
    }
  }

  /**
   * Get user transactions history
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
   * Get transaction details by reference
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
