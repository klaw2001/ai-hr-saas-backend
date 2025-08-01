import { Router } from 'express';
import { register, login, refreshToken } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

export default router;
