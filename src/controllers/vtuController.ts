import { Request, Response } from 'express';
import { VTUService } from '../services/vtuService';

export class VTUController {
  static async purchase(req: Request, res: Response) {
    try {
      const { user_id, service_type, network, phone_number, plan_id, amount, transaction_pin, preferred_provider } = req.body;

      if (!user_id || !service_type || !network || !phone_number || !amount || !transaction_pin) {
        return res.status(400).json({ success: false, message: 'Missing required VTU transaction parameters.' });
      }

      const result = await VTUService.processVTUPurchase({
        user_id,
        service_type,
        network,
        phone_number,
        plan_id,
        amount: Number(amount),
        transaction_pin,
        preferred_provider,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const history = await VTUService.getTransactionHistory(userId, limit, page);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getByReference(req: Request, res: Response) {
    try {
      const reference = req.params.reference;
      const transaction = await VTUService.getTransactionByReference(reference);
      return res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}
