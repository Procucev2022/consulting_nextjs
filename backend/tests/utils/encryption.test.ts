import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encryptData,
  decryptData,
  serializeEncryptedPayload,
  deserializeEncryptedPayload,
  encryptField,
  decryptField,
  generateEncryptionKey,
  deriveKeyFromPassphrase,
  resolveEncryptionKey
} from '../../src/utils/encryption';
import { CRYPTO_ERRORS } from '../../src/constants/crypto';

describe('AES-256-GCM Encryption Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveEncryptionKey', () => {
    it('should resolve key from Buffer of 32 bytes', () => {
      const buf = Buffer.alloc(32, 'a');
      expect(resolveEncryptionKey(buf)).toBe(buf);
    });

    it('should reject Buffer not equal to 32 bytes', () => {
      const buf = Buffer.alloc(16, 'a');
      expect(() => resolveEncryptionKey(buf)).toThrow(CRYPTO_ERRORS.INVALID_KEY);
    });

    it('should resolve 64-char hex string', () => {
      const hex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const key = resolveEncryptionKey(hex);
      expect(key.length).toBe(32);
    });

    it('should resolve 32-char utf8 string', () => {
      const str = '12345678901234567890123456789012';
      const key = resolveEncryptionKey(str);
      expect(key.length).toBe(32);
    });

    it('should reject invalid string key length', () => {
      expect(() => resolveEncryptionKey('too-short')).toThrow(CRYPTO_ERRORS.INVALID_KEY);
    });

    it('should fallback to default dev key if env is empty', () => {
      delete process.env.APP_ENCRYPTION_KEY;
      const key = resolveEncryptionKey();
      expect(key.length).toBe(32);
    });

    it('should reject invalid env key', () => {
      process.env.APP_ENCRYPTION_KEY = 'invalid-hex';
      expect(() => resolveEncryptionKey()).toThrow(CRYPTO_ERRORS.INVALID_KEY);
    });
  });

  describe('deriveKeyFromPassphrase', () => {
    it('should derive a 32-byte key from passphrase and salt', () => {
      const key = deriveKeyFromPassphrase('super-secret', 'custom-salt');
      expect(key.length).toBe(32);
      expect(Buffer.isBuffer(key)).toBe(true);
    });

    it('should throw if passphrase or salt is missing', () => {
      expect(() => deriveKeyFromPassphrase('', 'salt')).toThrow('Passphrase and salt are required');
      expect(() => deriveKeyFromPassphrase('pass', '')).toThrow('Passphrase and salt are required');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a random 64-character hex key', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).toHaveLength(64);
      expect(key2).toHaveLength(64);
      expect(key1).not.toBe(key2);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt string plaintext correctly', () => {
      const plaintext = 'Confidential procurement record #PO-8829';
      const encrypted = encryptData(plaintext);

      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();

      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Buffer plaintext', () => {
      const buf = Buffer.from('Buffer sensitive data', 'utf8');
      const encrypted = encryptData(buf);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe('Buffer sensitive data');
    });

    it('should encrypt and decrypt object payload', () => {
      const obj = { vendorId: 'VEND-001', amount: 50000 };
      const encrypted = encryptData(obj);
      const decrypted = decryptData(encrypted);
      expect(JSON.parse(decrypted)).toEqual(obj);
    });

    it('should support associated authenticated data (AAD)', () => {
      const plaintext = 'Sensitive banking IBAN';
      const aad = 'tenant:123:context';
      const encrypted = encryptData(plaintext, undefined, { associatedData: aad });

      const decrypted = decryptData(encrypted, undefined, { associatedData: aad });
      expect(decrypted).toBe(plaintext);

      // Decrypting with altered AAD must fail tag verification
      expect(() => decryptData(encrypted, undefined, { associatedData: 'wrong:aad' })).toThrow(
        CRYPTO_ERRORS.DECRYPTION_FAILED
      );
    });

    it('should support salt with key passphrase', () => {
      const plaintext = 'Secret message with salt';
      const passphrase = 'my-custom-passphrase';
      const salt = 'salt-123';

      const encrypted = encryptData(plaintext, passphrase, { salt });
      expect(encrypted.salt).toBe(salt);

      const decrypted = decryptData(encrypted, passphrase);
      expect(decrypted).toBe(plaintext);
    });

    it('should support custom encoding (base64)', () => {
      const plaintext = 'Testing base64 encoding';
      const encrypted = encryptData(plaintext, undefined, { encoding: 'base64' });
      const decrypted = decryptData(encrypted, undefined, { encoding: 'base64' });
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption if ciphertext is tampered', () => {
      const encrypted = encryptData('Original data');
      const tampered = {
        ...encrypted,
        ciphertext: (encrypted.ciphertext[0] === '0' ? '1' : '0') + encrypted.ciphertext.substring(1)
      };

      expect(() => decryptData(tampered)).toThrow(CRYPTO_ERRORS.DECRYPTION_FAILED);
    });

    it('should fail decryption if tag is tampered', () => {
      const encrypted = encryptData('Original data');
      const tampered = {
        ...encrypted,
        tag: (encrypted.tag[0] === '0' ? '1' : '0') + encrypted.tag.substring(1)
      };

      expect(() => decryptData(tampered)).toThrow(CRYPTO_ERRORS.DECRYPTION_FAILED);
    });

    it('should fail if IV length is invalid', () => {
      const encrypted = encryptData('Original data');
      const invalid = { ...encrypted, iv: 'deadbeef' };
      expect(() => decryptData(invalid)).toThrow(CRYPTO_ERRORS.INVALID_IV);
    });

    it('should fail if tag length is invalid', () => {
      const encrypted = encryptData('Original data');
      const invalid = { ...encrypted, tag: 'deadbeef' };
      expect(() => decryptData(invalid)).toThrow(CRYPTO_ERRORS.INVALID_TAG);
    });

    it('should fail if payload fields are missing', () => {
      expect(() => decryptData({ algorithm: 'aes-256-gcm' } as any)).toThrow(CRYPTO_ERRORS.INVALID_PAYLOAD);
    });
  });

  describe('serializeEncryptedPayload and deserializeEncryptedPayload', () => {
    it('should serialize and deserialize compact delimiter format', () => {
      const encrypted = encryptData('Sample payload text');
      const serialized = serializeEncryptedPayload(encrypted);

      expect(serialized.startsWith('aes256gcm:')).toBe(true);

      const deserialized = deserializeEncryptedPayload(serialized);
      expect(deserialized.iv).toBe(encrypted.iv);
      expect(deserialized.tag).toBe(encrypted.tag);
      expect(deserialized.ciphertext).toBe(encrypted.ciphertext);

      const decrypted = decryptData(serialized);
      expect(decrypted).toBe('Sample payload text');
    });

    it('should serialize and deserialize with salt', () => {
      const payload = {
        algorithm: 'aes-256-gcm',
        iv: '0102030405060708090a0b0c',
        tag: '0102030405060708090a0b0c0d0e0f10',
        ciphertext: 'abcdef',
        salt: 'salthex123'
      };
      const serialized = serializeEncryptedPayload(payload);
      expect(serialized).toBe('aes256gcm:0102030405060708090a0b0c:0102030405060708090a0b0c0d0e0f10:abcdef:salthex123');

      const parsed = deserializeEncryptedPayload(serialized);
      expect(parsed.salt).toBe('salthex123');
    });

    it('should deserialize JSON payload format', () => {
      const payload = {
        algorithm: 'aes-256-gcm',
        iv: '0102030405060708090a0b0c',
        tag: '0102030405060708090a0b0c0d0e0f10',
        ciphertext: 'abcdef'
      };
      const parsed = deserializeEncryptedPayload(JSON.stringify(payload));
      expect(parsed.ciphertext).toBe('abcdef');
    });

    it('should reject invalid serialization strings', () => {
      expect(() => deserializeEncryptedPayload('')).toThrow(CRYPTO_ERRORS.INVALID_PAYLOAD);
      expect(() => deserializeEncryptedPayload(null as any)).toThrow(CRYPTO_ERRORS.INVALID_PAYLOAD);
      expect(() => deserializeEncryptedPayload('invalid:short')).toThrow(CRYPTO_ERRORS.INVALID_PAYLOAD);
      expect(() => deserializeEncryptedPayload('wrongprefix:1:2:3')).toThrow(CRYPTO_ERRORS.INVALID_PAYLOAD);
    });
  });

  describe('encryptField and decryptField', () => {
    it('should encrypt and decrypt complex JSON objects', () => {
      const complexObject = {
        id: 'ACC-991',
        vendor: 'Titan Industries',
        routingNumber: '992817293',
        rates: [1.2, 3.4, 5.6]
      };

      const serialized = encryptField(complexObject);
      expect(typeof serialized).toBe('string');
      expect(serialized.startsWith('aes256gcm:')).toBe(true);

      const decrypted = decryptField<typeof complexObject>(serialized);
      expect(decrypted).toEqual(complexObject);
    });

    it('should encrypt and decrypt primitive string fields', () => {
      const str = 'Plain String Value';
      const serialized = encryptField(str);
      const decrypted = decryptField<string>(serialized);
      expect(decrypted).toBe(str);
    });
  });
});
