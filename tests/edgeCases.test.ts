import { normalizeNigerianPhoneNumber } from '../src/utils/phoneNormalization';
import { InlomaxProvider } from '../src/services/providers/inlomaxProvider';
import { HusmodataProvider } from '../src/services/providers/husmodataProvider';
import { Network } from '@prisma/client';

describe('QA & Security Edge Cases Test Suite', () => {

  // EDGE CASE 5: Phone Number Format Normalization
  describe('Phone Number Normalization', () => {
    it('should normalize standard local number 08031234567', () => {
      expect(normalizeNigerianPhoneNumber('08031234567')).toBe('08031234567');
    });

    it('should normalize +234 format +2348031234567 to 08031234567', () => {
      expect(normalizeNigerianPhoneNumber('+2348031234567')).toBe('08031234567');
    });

    it('should normalize 234 prefix without plus 2348031234567', () => {
      expect(normalizeNigerianPhoneNumber('2348031234567')).toBe('08031234567');
    });

    it('should normalize 10-digit number without leading zero 8031234567', () => {
      expect(normalizeNigerianPhoneNumber('8031234567')).toBe('08031234567');
    });

    it('should throw error for invalid numbers', () => {
      expect(() => normalizeNigerianPhoneNumber('12345')).toThrow();
      expect(() => normalizeNigerianPhoneNumber('01012345678')).toThrow();
    });
  });

  // EDGE CASE 3: Provider False Positives (HTTP 200 OK with failed body status)
  describe('Provider False Positives Handling', () => {
    it('InlomaxProvider should return success: false when body says status failed', async () => {
      const provider = new InlomaxProvider();
      
      // Mock fetch returning HTTP 200 OK with body containing status: 'failed'
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'failed', message: 'Insufficient Provider Balance' }),
      });

      const response = await provider.purchaseAirtime(Network.MTN, '08031234567', 500);
      expect(response.success).toBe(false);
      expect(response.status).toBe('FAILED');
      expect(response.message).toContain('Insufficient Provider Balance');
    });

    it('HusmodataProvider should return success: false when body says Status failed', async () => {
      const provider = new HusmodataProvider();
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ Status: 'failed', msg: 'Provider gateway timeout' }),
      });

      const response = await provider.purchaseData(Network.AIRTEL, '08029998877', 'plan_1gb');
      expect(response.success).toBe(false);
      expect(response.status).toBe('FAILED');
      expect(response.message).toContain('Provider gateway timeout');
    });
  });

  // EDGE CASE 2: Concurrent Request Idempotency
  describe('Concurrent Request Idempotency', () => {
    it('should block duplicate requests sharing the same x-idempotency-key header', async () => {
      // Demonstrated via idempotencyMiddleware unit check
      const { idempotencyMiddleware } = require('../src/middleware/idempotencyMiddleware');
      const req: any = { headers: { 'x-idempotency-key': 'KEY-12345' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 200,
      };
      const next = jest.fn();

      // First call -> proceeds to next()
      idempotencyMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Simulate response JSON completion
      res.json({ success: true, tx: 'VTU-123' });

      // Second call with same idempotency key -> blocked with cached response
      const req2: any = { headers: { 'x-idempotency-key': 'KEY-12345' } };
      const res2: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next2 = jest.fn();

      idempotencyMiddleware(req2, res2, next2);
      expect(next2).not.toHaveBeenCalled();
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ success: true, tx: 'VTU-123' });
    });
  });
});
