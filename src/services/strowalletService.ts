import crypto from 'crypto';
import { WalletService } from './walletService';
import { prisma } from '../config/prisma';
import { DuplicateTransactionError } from '../errors/walletErrors';

export interface StrowalletUserPayload {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface StrowalletVirtualAccountResponse {
  account_number: string;
  bank_name: string;
  account_name: string;
  customer_id?: string;
}

export interface StrowalletWebhookPayload {
  event: string;
  reference: string;
  session_id?: string;
  amount: number;
  customer?: {
    email?: string;
    phone?: string;
  };
  account_details?: {
    account_number?: string;
    bank_name?: string;
  };
  timestamp?: string;
}

export class StrowalletService {
  private static readonly BASE_URL = process.env.STROWALLET_BASE_URL || 'https://api.strowallet.com/v1';
  private static readonly SECRET_KEY = process.env.STROWALLET_SECRET_KEY || '';
  private static readonly PUBLIC_KEY = process.env.STROWALLET_PUBLIC_KEY || '';
  private static readonly WEBHOOK_SECRET = process.env.STROWALLET_WEBHOOK_SECRET || '';

  /**
   * Create dedicated NGN virtual bank account via Strowallet API on user signup.
   */
  static async createVirtualAccount(user: StrowalletUserPayload): Promise<StrowalletVirtualAccountResponse> {
    try {
      if (this.SECRET_KEY && this.SECRET_KEY !== 'mock_secret_key') {
        const response = await fetch(`${this.BASE_URL}/virtual-accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.SECRET_KEY}`,
            'X-Public-Key': this.PUBLIC_KEY,
          },
          body: JSON.stringify({
            email: user.email,
            name: user.full_name,
            phoneNumber: user.phone,
            currency: 'NGN',
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to generate Strowallet virtual account');
        }

        return {
          account_number: data.data.account_number,
          bank_name: data.data.bank_name || 'Sterling Bank (Strowallet)',
          account_name: data.data.account_name || `${user.full_name} / VTU App`,
        };
      }

      // Development Sandbox Virtual Account Generation
      const generatedAccountNumber = `8${Math.floor(100000009 + Math.random() * 899999990)}`;
      const partnerBanks = ['Sterling Bank (Strowallet)', 'Wema Bank (Strowallet)', 'Fidelity Bank (Strowallet)'];
      const selectedBank = partnerBanks[Math.floor(Math.random() * partnerBanks.length)];

      return {
        account_number: generatedAccountNumber,
        bank_name: selectedBank,
        account_name: `${user.full_name} / VTU App`,
      };
    } catch (error: any) {
      console.error('[StrowalletService] Virtual Account Creation Error:', error);
      throw new Error(`Failed to generate Strowallet virtual account: ${error.message}`);
    }
  }

  /**
   * Cryptographically verify incoming Strowallet Webhook Signature (HMAC SHA-512).
   */
  static verifyWebhookSignature(payload: string | Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;

    const secret = this.WEBHOOK_SECRET || 'dev_strowallet_webhook_secret';
    const computedSignature = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signatureHeader, 'utf-8');
    const computedBuffer = Buffer.from(computedSignature, 'utf-8');

    if (signatureBuffer.length !== computedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  }

  /**
   * Process automated wallet deposit webhook event from Strowallet.
   * Performs idempotency pre-check on reference / session_id before executing atomic transaction.
   */
  static async processFundingWebhook(payload: StrowalletWebhookPayload) {
    const { reference, session_id, amount, customer, account_details } = payload;

    if (!reference && !session_id) {
      throw new Error('Invalid webhook payload: missing reference or session_id');
    }

    if (!amount || amount <= 0) {
      throw new Error(`Invalid credit amount: ₦${amount}`);
    }

    // Unique ledger reference constructed using session_id or reference
    const depositReference = `STROWALLET-DEP-${session_id || reference}`;

    console.log(`[Strowallet Service Log] Processing deposit webhook. Reference: '${depositReference}', Amount: ₦${amount}`);

    // 1. Strict Idempotency Check: Pre-check if reference or session_id already exists in LedgerEntries
    const existingLedger = await prisma.ledgerEntry.findUnique({
      where: { reference: depositReference },
    });

    if (existingLedger) {
      console.warn(`[Strowallet Service Log] Idempotent duplicate event ignored for reference '${depositReference}'`);
      throw new DuplicateTransactionError(depositReference);
    }

    // 2. Locate User by email or virtual account number
    let user = null;
    if (customer?.email) {
      user = await prisma.user.findUnique({
        where: { email: customer.email.toLowerCase() },
      });
    }

    if (!user && account_details?.account_number) {
      const wallet = await prisma.wallet.findFirst({
        where: { virtual_account_number: account_details.account_number },
        include: { user: true },
      });
      if (wallet) user = wallet.user;
    }

    if (!user) {
      console.error(`[Strowallet Service Error] Target user not found for email '${customer?.email}' or account '${account_details?.account_number}'`);
      throw new Error(`Target user not found for email '${customer?.email}' or account '${account_details?.account_number}'`);
    }

    // 3. Atomically Credit Wallet inside Database Transaction with Row-Level Locking (`FOR UPDATE`)
    const description = `Automated Deposit via ${account_details?.bank_name || 'Strowallet'} (Session ID: ${session_id || reference})`;

    const result = await WalletService.creditWallet({
      user_id: user.id,
      amount,
      reference: depositReference,
      description,
    });

    console.log(`[Strowallet Service Log] Successfully credited wallet ID '${result.wallet.id}' with ₦${amount}. New balance: ₦${result.wallet.balance}`);
    return result;
  }
}
