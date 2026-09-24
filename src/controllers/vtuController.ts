import { Request, Response } from 'express';
import { Network, ServiceType } from '@prisma/client';
import { VtuService } from '../services/vtuService';

export class VTUController {
  static async purchase(req: Request, res: Response) {
    try {
      const {
        user_id,
        service_type,
        network,
        phone_number,
        plan_id,
        service_id,
        variation_code,
        customer_id,
        service_name,
        amount,
        transaction_pin,
        preferred_provider,
      } = req.body;

      if (!user_id || !service_type || !phone_number || !amount || !transaction_pin) {
        return res.status(400).json({ success: false, message: 'Missing required VTU transaction parameters.' });
      }

      if (service_type !== ServiceType.CABLE_TV && !network) {
        return res.status(400).json({ success: false, message: 'Network is required for airtime and data purchases.' });
      }

      const result = await VtuService.processPurchase({
        user_id,
        service_type,
        network,
        phone_number,
        plan_id,
        service_id,
        variation_code,
        customer_id,
        service_name,
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

  static async getDataPlans(req: Request, res: Response) {
    try {
      const network = req.query.network as Network;
      if (!network || !Object.values(Network).includes(network)) {
        return res.status(400).json({ success: false, message: 'A valid network is required.' });
      }
      const plans = await VtuService.getDataPlans(network);
      return res.status(200).json({ success: true, data: plans });
    } catch (error: any) {
      return res.status(502).json({ success: false, message: error.message });
    }
  }

  static async getCableTvPlans(req: Request, res: Response) {
    try {
      const serviceId = String(req.query.service_id || '').toLowerCase();
      if (!['dstv', 'gotv', 'startimes', 'showmax'].includes(serviceId)) {
        return res.status(400).json({ success: false, message: 'A valid cable service_id is required.' });
      }
      const plans = await VtuService.getCableTvPlans(serviceId);
      return res.status(200).json({ success: true, data: plans });
    } catch (error: any) {
      return res.status(502).json({ success: false, message: error.message });
    }
  }

  static async verifySmartCard(req: Request, res: Response) {
    try {
      const serviceId = String(req.body.service_id || '').toLowerCase();
      const customerId = String(req.body.customer_id || '');
      if (!serviceId || !customerId) {
        return res.status(400).json({ success: false, message: 'service_id and customer_id are required.' });
      }
      const customer = await VtuService.verifySmartCard(serviceId, customerId);
      return res.status(200).json({ success: true, data: customer });
    } catch (error: any) {
      return res.status(502).json({ success: false, message: error.message });
    }
  }

  static async getProviderBalances(req: Request, res: Response) {
    try {
      const balances = await VtuService.checkAllProviderBalances();
      return res.status(200).json({ success: true, data: balances });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const history = await VtuService.getTransactionHistory(userId, limit, page);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getByReference(req: Request, res: Response) {
    try {
      const reference = req.params.reference;
      const transaction = await VtuService.getTransactionByReference(reference);
      return res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}
