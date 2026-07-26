import { Request, Response } from 'express';
import { StrowalletService } from '../services/strowalletService';
import { DuplicateTransactionError } from '../errors/walletErrors';

export class WebhookController {
  /**
   * Handle incoming Strowallet Webhook for automated wallet funding.
   * Performs cryptographic signature verification & idempotent atomic wallet credit.
   */
  static async handleStrowalletWebhook(req: Request, res: Response) {
    try {
      const signatureHeader = req.headers['x-strowallet-signature'] as string | undefined;
      const rawBody = req.body ? JSON.stringify(req.body) : '';

      // 1. Cryptographic Signature Verification
      // Note: In production, pass the raw buffer / unparsed body string for signature check
      const isValidSignature = StrowalletService.verifyWebhookSignature(rawBody, signatureHeader);
      
      // In strict production mode:
      if (process.env.NODE_ENV === 'production' && !isValidSignature) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or missing Strowallet webhook signature',
        });
      }

      const payload = req.body;

      if (!payload || !payload.event) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid webhook payload structure',
        });
      }

      // 2. Process automated wallet funding event
      if (payload.event === 'virtual_account.credited' || payload.event === 'transfer.success') {
        const result = await StrowalletService.processFundingWebhook({
          event: payload.event,
          reference: payload.reference || payload.id || `TX-${Date.now()}`,
          amount: Number(payload.amount || payload.data?.amount),
          customer: payload.customer || { email: payload.data?.customer_email },
          account_details: payload.account_details || {
            account_number: payload.data?.account_number,
            bank_name: payload.data?.bank_name,
          },
          timestamp: payload.timestamp || new Date().toISOString(),
        });

        return res.status(200).json({
          status: 'success',
          message: 'Wallet credited successfully via Strowallet webhook.',
          data: {
            wallet_id: result.wallet.id,
            ledger_reference: result.ledger.reference,
            new_balance: result.wallet.balance,
          },
        });
      }

      // Acknowledge other unhandled webhook events gracefully
      return res.status(200).json({
        status: 'ignored',
        message: `Event type '${payload.event}' acknowledged but requires no wallet update.`,
      });
    } catch (error: any) {
      if (error instanceof DuplicateTransactionError) {
        // Return 200 OK for duplicate webhooks to prevent provider retry loops
        return res.status(200).json({
          status: 'success',
          message: 'Webhook reference previously processed (idempotent response).',
        });
      }

      console.error('[Strowallet Webhook Error]:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to process webhook',
      });
    }
  }
}
