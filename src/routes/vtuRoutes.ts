import { Router } from 'express';
import { VTUController } from '../controllers/vtuController';

const router = Router();

router.get('/plans', VTUController.getDataPlans);
router.get('/cable/plans', VTUController.getCableTvPlans);
router.post('/cable/verify', VTUController.verifySmartCard);
router.post('/purchase', VTUController.purchase);
router.get('/balances', VTUController.getProviderBalances);
router.get('/history/:userId', VTUController.getHistory);
router.get('/transaction/:reference', VTUController.getByReference);

export default router;
