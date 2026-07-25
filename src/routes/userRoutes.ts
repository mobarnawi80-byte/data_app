import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.post('/register', UserController.register);
router.get('/:id', UserController.getProfile);
router.patch('/:id/status', UserController.updateStatus);

export default router;
