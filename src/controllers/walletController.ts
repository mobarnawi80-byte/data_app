import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';

export class WalletController {
  static async getBalance(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const wallet = await WalletService.getWalletByUserId(userId);
      return res.status(200).json({ success: true, data: wallet });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  static async creditWallet(req: Request, res: Response) {
    try {
      const { user_id, amount, reference, description } = req.body;

      if (!user_id || !amount || !reference) {
        return res.status(400).json({ success: false, message: 'Missing user_id, amount, or reference.' });
      }

      const result = await WalletService.creditWallet({
        user_id,
        amount: Number(amount),
        reference,
        description: description || 'Manual/Gateway Wallet Top-Up',
      });

      return res.status(200).json({
        success: true,
        message: `Wallet credited with ₦${amount} successfully.`,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getLedgerHistory(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const history = await WalletService.getLedgerHistory(userId, limit, page);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
