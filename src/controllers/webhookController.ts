import { Request, Response } from 'express';
import { StrowalletService } from '../services/strowalletService';
import { DuplicateTransactionError } from '../errors/walletErrors';

export class WebhookController {
  /**
   * Strowallet Webhook Listener Endpoint (`POST /api/v1/webhooks/strowallet`).
   * Validates signature, parses transaction reference/session_id/amount/account_number,
   * performs strict idempotency check, atomically credits user wallet via WalletService.creditWallet(),
   * and returns HTTP 200 immediately.
   */
  static async handleStrowalletWebhook(req: Request, res: Response) {
    const startTime = Date.now();
    const signatureHeader = req.headers['x-strowallet-signature'] as string | undefined;

    try {
      // 1. Cryptographic HMAC SHA-512 Signature Verification
      const rawBody = JSON.stringify(req.body);
      const isValidSignature = StrowalletService.verifyWebhookSignature(rawBody, signatureHeader);

      if (process.env.NODE_ENV === 'production' && !isValidSignature) {
        console.warn('[Strowallet Webhook Warning]: Invalid signature header received.');
        return res.status(401).json({
          status: 'error',
          message: 'Invalid cryptographic signature header.',
        });
      }

      const payload = req.body;
      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Empty webhook payload received.',
        });
      }

      // Extract required fields
      const transactionReference = payload.reference || payload.id;
      const sessionId = payload.session_id || payload.sessionId;
      const amountCredited = Number(payload.amount || payload.data?.amount);
      const accountNumber = payload.account_number || payload.account_details?.account_number;
      const customerEmail = payload.customer_email || payload.customer?.email;
      const bankName = payload.bank_name || payload.account_details?.bank_name;

      console.log(`[Strowallet Webhook Received]: Ref='${transactionReference}', SessionID='${sessionId}', Amount=₦${amountCredited}, Account='${accountNumber}'`);

      // 2. Process automated wallet credit via StrowalletService
      const result = await StrowalletService.processFundingWebhook({
        event: payload.event || 'virtual_account.credited',
        reference: transactionReference,
        session_id: sessionId,
        amount: amountCredited,
        customer: { email: customerEmail },
        account_details: { account_number: accountNumber, bank_name: bankName },
      });

      const processingTime = Date.now() - startTime;
      console.log(`[Strowallet Webhook Success]: Credited ₦${amountCredited} to user in ${processingTime}ms.`);

      // 3. Return HTTP 200 immediately
      return res.status(200).json({
        status: 'success',
        message: 'Wallet funded successfully via Strowallet automated transfer.',
        data: {
          reference: result.ledger.reference,
          amount_credited: result.ledger.amount,
          new_balance: result.wallet.balance,
        },
      });
    } catch (error: any) {
      if (error instanceof DuplicateTransactionError) {
        // Return HTTP 200 immediately for duplicate events to acknowledge provider idempotency
        console.log(`[Strowallet Webhook Idempotency]: Duplicate webhook ignored.`);
        return res.status(200).json({
          status: 'success',
          message: 'Webhook reference/session_id previously processed (idempotent response).',
        });
      }

      console.error('[Strowallet Webhook Failure]:', error.message);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error processing webhook payload.',
      });
    }
  }
}
