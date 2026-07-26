import { Router } from 'express';
import { AdminController } from '../controllers/adminController';

const router = Router();

// Dashboard Overview & Live Balances
router.get('/dashboard-stats', AdminController.getDashboardStats);
router.post('/provider-config', AdminController.setProviderConfig);

// Transaction Monitor & Operations
router.get('/transactions', AdminController.getTransactions);
router.post('/transactions/:id/refund', AdminController.forceRefundTransaction);

// User Management & Wallet Adjustment
router.post('/users/:id/adjust-wallet', AdminController.adjustUserWallet);
router.patch('/users/:id/status', AdminController.updateUserStatus);

export default router;
