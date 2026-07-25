import { Router } from 'express';
import { VTUController } from '../controllers/vtuController';

const router = Router();

router.post('/purchase', VTUController.purchase);
router.get('/history/:userId', VTUController.getHistory);
router.get('/transaction/:reference', VTUController.getByReference);

export default router;
