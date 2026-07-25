import { Prisma, PrismaClient, LedgerType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreditWalletDTO, DebitWalletDTO } from '../types/vtu';

export class WalletService {
  /**
   * Credit user's wallet atomically with ledger entry.
   * Ensures idempotency via unique reference.
   */
  static async creditWallet(dto: CreditWalletDTO, externalTx?: Prisma.TransactionClient) {
    const db = externalTx || prisma;

    return await db.$transaction(async (tx) => {
      // 1. Check idempotency: Ensure reference has not been processed
      const existingLedger = await tx.ledgerEntry.findUnique({
        where: { reference: dto.reference },
      });

      if (existingLedger) {
        throw new Error(`Duplicate ledger transaction reference: ${dto.reference}`);
      }

      // 2. Fetch target wallet
      const wallet = await tx.wallet.findUnique({
        where: { user_id: dto.user_id },
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ID: ${dto.user_id}`);
      }

      const amountDecimal = new Prisma.Decimal(dto.amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const balanceAfter = balanceBefore.add(amountDecimal);

      // 3. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
        },
      });

      // 4. Create immutable LedgerEntry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          wallet_id: wallet.id,
          type: LedgerType.CREDIT,
          amount: amountDecimal,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference: dto.reference,
          description: dto.description,
        },
      });

      return {
        wallet: updatedWallet,
        ledger: ledgerEntry,
      };
    });
  }

  /**
   * Debit user's wallet atomically with ledger entry.
   * Includes strict balance verification & atomic concurrency checks.
   */
  static async debitWallet(dto: DebitWalletDTO, externalTx?: Prisma.TransactionClient) {
    const db = externalTx || prisma;

    return await db.$transaction(async (tx) => {
      // 1. Check idempotency: Ensure reference has not been processed
      const existingLedger = await tx.ledgerEntry.findUnique({
        where: { reference: dto.reference },
      });

      if (existingLedger) {
        throw new Error(`Duplicate ledger transaction reference: ${dto.reference}`);
      }

      // 2. Fetch target wallet
      const wallet = await tx.wallet.findUnique({
        where: { user_id: dto.user_id },
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ID: ${dto.user_id}`);
      }

      const amountDecimal = new Prisma.Decimal(dto.amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);

      // Check sufficient funds
      if (balanceBefore.lessThan(amountDecimal)) {
        throw new Error(`Insufficient wallet balance. Current balance: ₦${balanceBefore.toFixed(2)}, Required: ₦${amountDecimal.toFixed(2)}`);
      }

      const balanceAfter = balanceBefore.sub(amountDecimal);

      // 3. Atomic wallet update with balance guard (prevents race condition)
      const updateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: amountDecimal }, // Double-check constraint
        },
        data: {
          balance: balanceAfter,
        },
      });

      if (updateResult.count === 0) {
        throw new Error('Concurrent transaction detected or insufficient funds.');
      }

      const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });

      // 4. Create immutable LedgerEntry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          wallet_id: wallet.id,
          type: LedgerType.DEBIT,
          amount: amountDecimal,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference: dto.reference,
          description: dto.description,
        },
      });

      return {
        wallet: updatedWallet!,
        ledger: ledgerEntry,
      };
    });
  }

  /**
   * Get User Wallet info with latest balance
   */
  static async getWalletByUserId(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new Error(`Wallet not found for user ID: ${userId}`);
    }

    return wallet;
  }

  /**
   * Get ledger history for a wallet
   */
  static async getLedgerHistory(userId: string, limit = 20, page = 1) {
    const wallet = await this.getWalletByUserId(userId);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: { wallet_id: wallet.id },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.ledgerEntry.count({
        where: { wallet_id: wallet.id },
      }),
    ]);

    return {
      entries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
