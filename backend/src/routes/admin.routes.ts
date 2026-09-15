/**
 * Admin Management Routes (Backend)
 */

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';

const router = Router();

router.get('/users', (req, res) => adminController.listUsers(req, res));
router.patch('/users/:id/status', (req, res) => adminController.updateUserStatus(req, res));
router.patch('/users/:id/tier', (req, res) => adminController.updateUserTier(req, res));

export default router;
