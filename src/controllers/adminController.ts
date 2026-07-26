import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { Provider, TransactionStatus, UserStatus } from '@prisma/client';
import { VtuService } from '../services/vtuService';
import { WalletService } from '../services/walletService';

export class AdminController {
  // Global config store in-memory / DB for provider mode
  private static providerMode: 'INLOMAX' | 'HUSMODATA' | 'AUTO_FAILOVER' = 'AUTO_FAILOVER';

  /**
   * GET /api/admin/dashboard-stats
   * Returns total user wallet balance sum, total daily sales, total profit margin, provider status health check.
   */
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // 1. Total User Wallet Balance Sum
      const totalWalletSum = await prisma.wallet.aggregate({
        _sum: { balance: true },
        _count: { id: true },
      });

      // 2. Daily Sales & Volume
      const dailySales = await prisma.transaction.aggregate({
        where: {
          status: TransactionStatus.SUCCESS,
          created_at: { gte: todayStart },
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      // 3. Profit Margin Calculation (Simulated 3.5% average markup margin on VTU sales)
      const dailyVolume = Number(dailySales._sum.amount || 0);
      const estimatedProfit = dailyVolume * 0.035;

      // 4. Live API Balances from Inlomax & Husmodata
      const providerBalances = await VtuService.checkAllProviderBalances();

      return res.status(200).json({
        success: true,
        data: {
          total_wallet_balance_sum: Number(totalWalletSum._sum.balance || 0),
          total_registered_users: totalWalletSum._count.id,
          daily_sales_volume: dailyVolume,
          daily_sales_count: dailySales._count.id,
          daily_estimated_profit: estimatedProfit,
          provider_mode: this.providerMode,
          providers_health: providerBalances.providers,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/provider-config
   * Toggle Primary Provider (INLOMAX vs HUSMODATA) or set AUTO_FAILOVER.
   */
  static async setProviderConfig(req: Request, res: Response) {
    try {
      const { mode } = req.body;

      if (!['INLOMAX', 'HUSMODATA', 'AUTO_FAILOVER'].includes(mode)) {
        return res.status(400).json({ success: false, message: 'Invalid provider mode selection.' });
      }

      AdminController.providerMode = mode;
      return res.status(200).json({
        success: true,
        message: `VTU Provider mode updated to ${mode}`,
        data: { mode: AdminController.providerMode },
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/admin/transactions
   * Monitor & filter transactions by status, phone_number, or reference.
   */
  static async getTransactions(req: Request, res: Response) {
    try {
      const { status, phone, reference, page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        where.status = status as TransactionStatus;
      }
      if (phone) where.phone_number = { contains: String(phone) };
      if (reference) where.reference = { contains: String(reference) };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: { user: { select: { full_name: true, email: true, phone: true } } },
          orderBy: { created_at: 'desc' },
          take: Number(limit),
          skip,
        }),
        prisma.transaction.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: { total, page: Number(page), limit: Number(limit) },
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/transactions/:id/refund
   * Force Refund button: Credit money back to user wallet & mark transaction FAILED.
   */
  static async forceRefundTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { admin_reason } = req.body;

      if (!admin_reason) {
        return res.status(400).json({ success: false, message: 'Compulsory admin reason is required for force refund.' });
      }

      const transaction = await prisma.transaction.findUnique({ where: { id } });
      if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

      if (transaction.status === TransactionStatus.FAILED) {
        return res.status(400).json({ success: false, message: 'Transaction has already been refunded/marked FAILED.' });
      }

      const refundRef = `ADMIN-REFUND-${transaction.reference}`;

      const result = await prisma.$transaction(async (tx) => {
        // Mark transaction FAILED
        const updatedTx = await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.FAILED, updated_at: new Date() },
        });

        // Credit money back to user's wallet
        const creditResult = await WalletService.creditWallet(
          {
            user_id: transaction.user_id,
            amount: Number(transaction.amount),
            reference: refundRef,
            description: `Admin Force Refund: ${admin_reason}`,
          },
          tx
        );

        return { updatedTx, creditResult };
      });

      return res.status(200).json({
        success: true,
        message: `Transaction ${transaction.reference} refunded successfully.`,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/users/:id/adjust-wallet
   * Manual credit/debit with compulsory admin reason log.
   */
  static async adjustUserWallet(req: Request, res: Response) {
    try {
      const { id } = req.params; // user_id
      const { type, amount, admin_reason } = req.body;

      if (!type || !amount || !admin_reason) {
        return res.status(400).json({ success: false, message: 'Missing type (CREDIT/DEBIT), amount, or compulsory admin_reason.' });
      }

      const ref = `ADMIN-ADJ-${Date.now()}`;
      const description = `Admin Manual ${type}: ${admin_reason}`;

      const result = type === 'CREDIT'
        ? await WalletService.creditWallet({ user_id: id, amount: Number(amount), reference: ref, description })
        : await WalletService.debitWallet({ user_id: id, amount: Number(amount), reference: ref, description });

      return res.status(200).json({
        success: true,
        message: `Wallet ${type.toLowerCase()}ed by ₦${amount} successfully.`,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   * Suspend or reactivate user account.
   */
  static async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid UserStatus.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, full_name: true, email: true, phone: true, status: true },
      });

      return res.status(200).json({
        success: true,
        message: `User status set to ${status}`,
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
