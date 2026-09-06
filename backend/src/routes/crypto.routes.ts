/**
 * Cryptography Routes (Backend)
 * 
 * Provides HTTP endpoints for authenticated AES-256-GCM data encryption,
 * decryption, and key generation.
 */

import { Router } from 'express';
import {
  encryptHandler,
  decryptHandler,
  generateKeyHandler
} from '../controllers/crypto.controller';
import { validateBody } from '../utils/validation';
import {
  encryptRequestSchema,
  decryptRequestSchema
} from '../constants/validation';

const router = Router();

router.post('/encrypt', validateBody(encryptRequestSchema), encryptHandler);
router.post('/decrypt', validateBody(decryptRequestSchema), decryptHandler);
router.get('/generate-key', generateKeyHandler);

export default router;
