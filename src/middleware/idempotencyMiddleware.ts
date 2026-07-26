import { Request, Response, NextFunction } from 'express';

const processedKeys = new Map<string, { status: number; body: any; timestamp: number }>();

// TTL: 60 seconds idempotency window
const IDEMPOTENCY_TTL_MS = 60000;

export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    return next(); // Proceed if no idempotency key provided
  }

  const now = Date.now();
  const cached = processedKeys.get(idempotencyKey);

  if (cached) {
    if (now - cached.timestamp < IDEMPOTENCY_TTL_MS) {
      console.warn(`[Idempotency Warning] Duplicate request blocked for key '${idempotencyKey}'`);
      return res.status(cached.status).json(cached.body);
    } else {
      processedKeys.delete(idempotencyKey);
    }
  }

  // Intercept res.json to cache response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 500) {
      processedKeys.set(idempotencyKey, {
        status: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
};
