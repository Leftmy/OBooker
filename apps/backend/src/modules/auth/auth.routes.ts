import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;