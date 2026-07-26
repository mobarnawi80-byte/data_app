import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app';
import { StrowalletService } from '../src/services/strowalletService';
import { WalletService } from '../src/services/walletService';

describe('Strowallet Webhook Listener (POST /api/v1/webhooks/strowallet)', () => {
  const webhookSecret = 'test_webhook_secret';

  beforeAll(() => {
    process.env.STROWALLET_WEBHOOK_SECRET = webhookSecret;
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.NODE_ENV = 'test';
  });

  const createSignature = (payload: object): string => {
    return crypto
      .createHmac('sha512', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  };

  it('should reject webhook requests with missing or invalid signature header (401)', async () => {
    const payload = { event: 'virtual_account.credited', reference: 'REF123', amount: 5000 };

    const res = await request(app)
      .post('/api/v1/webhooks/strowallet')
      .set('x-strowallet-signature', 'invalid_signature_hash')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Invalid cryptographic signature');
  });

  it('should credit wallet and return HTTP 200 for valid webhook payload', async () => {
    const payload = {
      event: 'virtual_account.credited',
      reference: 'STRO-TX-998811',
      session_id: 'SESS-772211',
      amount: 15000,
      account_number: '8123456789',
      customer_email: 'user@example.com',
      bank_name: 'Sterling Bank (Strowallet)',
    };

    const signature = createSignature(payload);

    // Mock StrowalletService.processFundingWebhook
    jest.spyOn(StrowalletService, 'processFundingWebhook').mockResolvedValueOnce({
      wallet: { id: 'w_123', user_id: 'u_123', balance: '15000.00' } as any,
      ledger: { id: 'l_123', reference: 'STROWALLET-DEP-SESS-772211', amount: '15000.00' } as any,
    });

    const res = await request(app)
      .post('/api/v1/webhooks/strowallet')
      .set('x-strowallet-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.amount_credited).toBe('15000.00');
  });

  it('should return HTTP 200 immediately for duplicate reference/session_id (Idempotency)', async () => {
    const payload = {
      event: 'virtual_account.credited',
      reference: 'STRO-TX-998811',
      session_id: 'SESS-772211',
      amount: 15000,
      customer_email: 'user@example.com',
    };

    const signature = createSignature(payload);

    // Mock DuplicateTransactionError
    const { DuplicateTransactionError } = require('../src/errors/walletErrors');
    jest.spyOn(StrowalletService, 'processFundingWebhook').mockRejectedValueOnce(
      new DuplicateTransactionError('STROWALLET-DEP-SESS-772211')
    );

    const res = await request(app)
      .post('/api/v1/webhooks/strowallet')
      .set('x-strowallet-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('previously processed');
  });
});
