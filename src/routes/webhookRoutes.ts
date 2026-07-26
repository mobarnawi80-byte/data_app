import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

// POST /api/webhooks/strowallet
router.post('/strowallet', WebhookController.handleStrowalletWebhook);

export default router;
