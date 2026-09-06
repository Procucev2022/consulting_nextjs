import { describe, it, expect, vi } from 'vitest';
import {
  encryptHandler,
  decryptHandler,
  generateKeyHandler
} from '../../src/controllers/crypto.controller';
import * as encryptionUtils from '../../src/utils/encryption';

describe('Crypto Controller', () => {
  const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  describe('encryptHandler', () => {
    it('should encrypt data and return 200 with serialized payload', () => {
      const req: any = {
        headers: { 'x-request-id': 'req-test-1' },
        body: {
          data: 'Confidential Procurement Contract',
          passphrase: 'secret-passphrase',
          associatedData: 'tenant-1'
        }
      };
      const res = createMockResponse();

      encryptHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          algorithm: 'aes-256-gcm',
          data: expect.objectContaining({
            algorithm: 'aes-256-gcm',
            iv: expect.any(String),
            tag: expect.any(String),
            ciphertext: expect.any(String)
          }),
          serialized: expect.stringContaining('aes256gcm:')
        })
      );
    });

    it('should handle encryption failure with HTTP 500', () => {
      const req: any = {
        headers: { 'x-request-id': 'req-test-err' },
        body: { data: 'Test Data' }
      };
      const res = createMockResponse();

      const spy = vi.spyOn(encryptionUtils, 'encryptData').mockImplementationOnce(() => {
        throw new Error('Encryption engine hardware fault');
      });

      encryptHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to encrypt data',
          error: 'Encryption engine hardware fault'
        })
      );

      spy.mockRestore();
    });
  });

  describe('decryptHandler', () => {
    it('should decrypt serialized payload and return 200 with plaintext', () => {
      const encrypted = encryptionUtils.encryptField('Original Secret Note');

      const req: any = {
        headers: { 'x-request-id': 'req-test-dec' },
        body: {
          payload: encrypted
        }
      };
      const res = createMockResponse();

      decryptHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        plaintext: 'Original Secret Note'
      });
    });

    it('should handle decryption failure with HTTP 400', () => {
      const req: any = {
        headers: { 'x-request-id': 'req-test-dec-err' },
        body: {
          payload: 'aes256gcm:deadbeef:deadbeef:corrupted'
        }
      };
      const res = createMockResponse();

      decryptHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to decrypt data'
        })
      );
    });
  });

  describe('generateKeyHandler', () => {
    it('should generate a 256-bit key and return 200', () => {
      const req: any = {};
      const res = createMockResponse();

      generateKeyHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        key: expect.any(String),
        algorithm: 'aes-256-gcm',
        keyLengthBytes: 32
      });
    });
  });
});
