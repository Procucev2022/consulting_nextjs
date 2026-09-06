/**
 * AES Cryptography Controller (Backend)
 * 
 * Exposes secure cryptographic endpoints for sensitive data encryption,
 * decryption, and key management.
 */

import type { Request, Response } from 'express';
import {
  encryptData,
  decryptData,
  serializeEncryptedPayload,
  generateEncryptionKey
} from '../utils/encryption';
import { AES_ALGORITHM, AES_KEY_LENGTH_BYTES } from '../constants/crypto';
import logger from '../utils/logger';

/**
 * Handles data encryption requests.
 */
export const encryptHandler = (req: Request, res: Response): Response | void => {
  const { data, passphrase, associatedData } = req.body;
  const requestId = req.headers['x-request-id'] as string;

  try {
    const options = {
      associatedData,
      salt: passphrase ? 'crypto-salt-consulting' : undefined
    };

    const encrypted = encryptData(data, passphrase, options);
    const serialized = serializeEncryptedPayload(encrypted);

    logger.info('Data encrypted successfully', {
      requestId,
      algorithm: encrypted.algorithm
    });

    return res.status(200).json({
      success: true,
      data: encrypted,
      serialized,
      algorithm: AES_ALGORITHM
    });
  } catch (err: unknown) {
    const errPayload = err as { message: string };
    logger.error('Encryption handler failed', { requestId }, err);
    return res.status(500).json({
      success: false,
      message: 'Failed to encrypt data',
      error: errPayload.message
    });
  }
};

/**
 * Handles data decryption requests.
 */
export const decryptHandler = (req: Request, res: Response): Response | void => {
  const { payload, passphrase, associatedData } = req.body;
  const requestId = req.headers['x-request-id'] as string;

  try {
    const options = {
      associatedData
    };

    const plaintext = decryptData(payload, passphrase, options);

    logger.info('Data decrypted successfully', { requestId });

    return res.status(200).json({
      success: true,
      plaintext
    });
  } catch (err: unknown) {
    const errPayload = err as { message: string };
    logger.warn('Decryption handler failed', { requestId, error: errPayload.message });
    return res.status(400).json({
      success: false,
      message: 'Failed to decrypt data',
      error: errPayload.message
    });
  }
};

/**
 * Generates a new cryptographically secure 256-bit encryption key.
 */
export const generateKeyHandler = (_req: Request, res: Response): Response | void => {
  const key = generateEncryptionKey();
  return res.status(200).json({
    success: true,
    key,
    algorithm: AES_ALGORITHM,
    keyLengthBytes: AES_KEY_LENGTH_BYTES
  });
};
