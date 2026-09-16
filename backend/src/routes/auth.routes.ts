/**
 * Authentication Routes (Backend)
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', (req, res) => authController.getMe(req, res));
router.post('/change-password', (req, res) => authController.changePassword(req, res));

export default router;
