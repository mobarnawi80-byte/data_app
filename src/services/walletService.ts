import { Prisma, LedgerType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreditWalletDTO, DebitWalletDTO } from '../types/vtu';
import {
  InsufficientFundsError,
  DuplicateTransactionError,
  WalletNotFoundError,
} from '../errors/walletErrors';

export interface WalletRecord {
  id: string;
  user_id: string;
  balance: Prisma.Decimal;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  virtual_account_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export class WalletService {
  /**
   * Credit user's wallet atomically inside a Database Transaction with Row-Level Locking (`FOR UPDATE`).
   * Creates double-entry immutable LedgerEntry.
   */
  static async creditWallet(dto: CreditWalletDTO, externalTx?: Prisma.TransactionClient) {
    const executeInTransaction = async (tx: Prisma.TransactionClient) => {
      // 1. Idempotency Check: Verify reference has not been processed previously
      const existingLedger = await tx.ledgerEntry.findUnique({
        where: { reference: dto.reference },
      });

      if (existingLedger) {
        throw new DuplicateTransactionError(dto.reference);
      }

      // 2. Row-Level Locking (FOR UPDATE): Lock target wallet row exclusively
      const wallets = await tx.$queryRaw<WalletRecord[]>`
        SELECT id, user_id, balance, virtual_account_number, virtual_bank_name, virtual_account_name, created_at, updated_at
        FROM "wallets"
        WHERE "user_id" = ${dto.user_id}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new WalletNotFoundError(dto.user_id);
      }

      const wallet = wallets[0];
      const amountDecimal = new Prisma.Decimal(dto.amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);
      const balanceAfter = balanceBefore.add(amountDecimal);

      // 3. Update Wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
        },
      });

      // 4. Create immutable Double-Entry Ledger record
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
    };

    if (externalTx) {
      return await executeInTransaction(externalTx);
    } else {
      return await prisma.$transaction(async (tx) => {
        return await executeInTransaction(tx);
      });
    }
  }

  /**
   * Debit user's wallet atomically inside a Database Transaction with Row-Level Locking (`FOR UPDATE`).
   * Enforces strict structured balance check (balance < amount) and creates double-entry immutable LedgerEntry.
   */
  static async debitWallet(dto: DebitWalletDTO, externalTx?: Prisma.TransactionClient) {
    const executeInTransaction = async (tx: Prisma.TransactionClient) => {
      // 1. Idempotency Check: Verify reference has not been processed previously
      const existingLedger = await tx.ledgerEntry.findUnique({
        where: { reference: dto.reference },
      });

      if (existingLedger) {
        throw new DuplicateTransactionError(dto.reference);
      }

      // 2. Row-Level Locking (FOR UPDATE): Acquire exclusive lock on target wallet row
      const wallets = await tx.$queryRaw<WalletRecord[]>`
        SELECT id, user_id, balance, virtual_account_number, virtual_bank_name, virtual_account_name, created_at, updated_at
        FROM "wallets"
        WHERE "user_id" = ${dto.user_id}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new WalletNotFoundError(dto.user_id);
      }

      const wallet = wallets[0];
      const amountDecimal = new Prisma.Decimal(dto.amount);
      const balanceBefore = new Prisma.Decimal(wallet.balance);

      // 3. Structured Error Check: balance < amount
      if (balanceBefore.lessThan(amountDecimal)) {
        throw new InsufficientFundsError(
          balanceBefore.toFixed(2),
          amountDecimal.toFixed(2),
          dto.user_id
        );
      }

      const balanceAfter = balanceBefore.sub(amountDecimal);

      // 4. Update Wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
        },
      });

      // 5. Create immutable Double-Entry Ledger record
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
        wallet: updatedWallet,
        ledger: ledgerEntry,
      };
    };

    if (externalTx) {
      return await executeInTransaction(externalTx);
    } else {
      return await prisma.$transaction(async (tx) => {
        return await executeInTransaction(tx);
      });
    }
  }

  /**
   * Get User Wallet info with latest balance
   */
  static async getWalletByUserId(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new WalletNotFoundError(userId);
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
