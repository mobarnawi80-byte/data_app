import { Request, Response, NextFunction } from 'express';

// List of allowed Strowallet webhook server IP addresses (configurable via environment variable)
const DEFAULT_ALLOWED_IPS = ['52.208.12.44', '54.72.19.112', '127.0.0.1', '::1'];

export const strowalletIpWhitelist = (req: Request, res: Response, next: NextFunction) => {
  // In development environment, IP whitelisting can be bypassed or toggled via config
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_IP_WHITELIST !== 'true') {
    return next();
  }

  const configuredIps = process.env.STROWALLET_ALLOWED_IPS
    ? process.env.STROWALLET_ALLOWED_IPS.split(',').map((ip) => ip.trim())
    : DEFAULT_ALLOWED_IPS;

  // Extract client IP address supporting proxy headers (X-Forwarded-For)
  const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress || '';

  const isAllowed = configuredIps.some((allowedIp) => clientIp.includes(allowedIp));

  if (!isAllowed) {
    console.warn(`[Security Alert] Strowallet Webhook request rejected from unauthorized IP: ${clientIp}`);
    return res.status(403).json({
      status: 'error',
      message: `Access denied: IP '${clientIp}' is not authorized to deliver Strowallet webhooks.`,
    });
  }

  next();
};
