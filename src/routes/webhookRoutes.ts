import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { strowalletIpWhitelist } from '../middleware/strowalletIpWhitelist';

const router = Router();

// POST /api/v1/webhooks/strowallet
router.post('/strowallet', strowalletIpWhitelist, WebhookController.handleStrowalletWebhook);

export default router;
