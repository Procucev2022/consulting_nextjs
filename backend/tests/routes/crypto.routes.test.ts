import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Crypto Routes (/api/crypto)', () => {
  describe('POST /api/crypto/encrypt and POST /api/crypto/decrypt', () => {
    it('should encrypt plaintext and then decrypt the serialized payload end-to-end', async () => {
      const plaintext = 'Sensitive financial invoice #INV-2026-901';

      // 1. Encrypt
      const encRes = await request(app)
        .post('/api/crypto/encrypt')
        .send({
          data: plaintext,
          passphrase: 'strong-passphrase-test',
          associatedData: 'tenant-apex'
        });

      expect(encRes.status).toBe(200);
      expect(encRes.body.success).toBe(true);
      expect(encRes.body.serialized).toBeDefined();
      expect(encRes.body.data.iv).toBeDefined();
      expect(encRes.body.data.tag).toBeDefined();

      const serialized = encRes.body.serialized;

      // 2. Decrypt with matching passphrase and associated data
      const decRes = await request(app)
        .post('/api/crypto/decrypt')
        .send({
          payload: serialized,
          passphrase: 'strong-passphrase-test',
          associatedData: 'tenant-apex'
        });

      expect(decRes.status).toBe(200);
      expect(decRes.body.success).toBe(true);
      expect(decRes.body.plaintext).toBe(plaintext);
    });

    it('should decrypt with structured EncryptedDataPayload object', async () => {
      const encRes = await request(app)
        .post('/api/crypto/encrypt')
        .send({
          data: 'Direct Object Test'
        });

      expect(encRes.status).toBe(200);
      const payloadObj = encRes.body.data;

      const decRes = await request(app)
        .post('/api/crypto/decrypt')
        .send({
          payload: payloadObj
        });

      expect(decRes.status).toBe(200);
      expect(decRes.body.plaintext).toBe('Direct Object Test');
    });

    it('should reject POST /api/crypto/encrypt when data field is missing with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/crypto/encrypt')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject POST /api/crypto/decrypt when payload is missing with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/crypto/decrypt')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/crypto/generate-key', () => {
    it('should return a generated 32-byte hexadecimal key', async () => {
      const res = await request(app).get('/api/crypto/generate-key');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.key).toHaveLength(64);
      expect(res.body.algorithm).toBe('aes-256-gcm');
      expect(res.body.keyLengthBytes).toBe(32);
    });
  });
});
