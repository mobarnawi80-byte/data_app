import { Router } from 'express';
import { WalletController } from '../controllers/walletController';

const router = Router();

router.get('/:userId', WalletController.getBalance);
router.post('/credit', WalletController.creditWallet);
router.get('/:userId/ledger', WalletController.getLedgerHistory);

export default router;
