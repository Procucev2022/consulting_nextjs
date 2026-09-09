import { describe, it, expect, vi } from 'vitest';
import {
  generateClientKey,
  importHexKey,
  exportKeyToHex,
  encryptDataClient,
  decryptDataClient,
  serializeClientPayload,
  deserializeClientPayload
} from '../../src/utils/encryption';
import { CLIENT_CRYPTO_ERRORS } from '../../src/constants/crypto';

describe('Frontend Client-Side AES-GCM Encryption Utility', () => {
  it('should generate a 256-bit AES-GCM CryptoKey and export it to hex', async () => {
    const key = await generateClientKey();
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');

    const hex = await exportKeyToHex(key);
    expect(hex).toHaveLength(64);

    const reimported = await importHexKey(hex);
    expect(reimported).toBeDefined();
    expect(reimported.algorithm.name).toBe('AES-GCM');
  });

  describe('encryptDataClient & decryptDataClient', () => {
    it('should encrypt and decrypt plaintext using default dev key', async () => {
      const plaintext = 'Sensitive procurement supplier quote: ₹42,00,000';
      const encrypted = await encryptDataClient(plaintext);

      expect(encrypted.algorithm).toBe('AES-GCM');
      expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex
      expect(encrypted.tag).toHaveLength(32); // 16 bytes = 32 hex
      expect(encrypted.ciphertext.length).toBeGreaterThan(0);

      const decrypted = await decryptDataClient(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt using custom hex key and associated data', async () => {
      const plaintext = 'Executive pricing model benchmark';
      const keyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const associatedData = 'tenant:global-enterprise';

      const encrypted = await encryptDataClient(plaintext, keyHex, { associatedData });
      const decrypted = await decryptDataClient(encrypted, keyHex, { associatedData });

      expect(decrypted).toBe(plaintext);

      // Decrypting with wrong associated data must fail
      await expect(
        decryptDataClient(encrypted, keyHex, { associatedData: 'wrong:aad' })
      ).rejects.toThrow(CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED);
    });

    it('should encrypt and decrypt using generated CryptoKey object', async () => {
      const cryptoKey = await generateClientKey();
      const plaintext = 'Direct CryptoKey payload';

      const encrypted = await encryptDataClient(plaintext, cryptoKey);
      const decrypted = await decryptDataClient(encrypted, cryptoKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should automatically deserialize compact string representation on decrypt', async () => {
      const plaintext = 'Serialized string test';
      const encrypted = await encryptDataClient(plaintext);
      const serialized = serializeClientPayload(encrypted);

      const decrypted = await decryptDataClient(serialized);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption when ciphertext is tampered', async () => {
      const encrypted = await encryptDataClient('Authentic data');
      const tampered = {
        ...encrypted,
        ciphertext: (encrypted.ciphertext.startsWith('00') ? 'ff' : '00') + encrypted.ciphertext.substring(2)
      };

      await expect(decryptDataClient(tampered)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED
      );
    });

    it('should fail decryption when tag is tampered', async () => {
      const encrypted = await encryptDataClient('Authentic data');
      const tampered = {
        ...encrypted,
        tag: (encrypted.tag.startsWith('00') ? 'ff' : '00') + encrypted.tag.substring(2)
      };

      await expect(decryptDataClient(tampered)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED
      );
    });

    it('should fail decryption when payload fields are missing', async () => {
      await expect(
        decryptDataClient({ algorithm: 'AES-GCM' } as any)
      ).rejects.toThrow(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
    });
  });

  describe('serializeClientPayload and deserializeClientPayload', () => {
    it('should serialize and deserialize compact payload format', () => {
      const payload = {
        algorithm: 'AES-GCM',
        iv: '0102030405060708090a0b0c',
        tag: '0102030405060708090a0b0c0d0e0f10',
        ciphertext: 'abcdef123456'
      };

      const serialized = serializeClientPayload(payload);
      expect(serialized).toBe('aes256gcm:0102030405060708090a0b0c:0102030405060708090a0b0c0d0e0f10:abcdef123456');

      const parsed = deserializeClientPayload(serialized);
      expect(parsed).toEqual(payload);
    });

    it('should throw when deserializing invalid or empty string', () => {
      expect(() => deserializeClientPayload('')).toThrow(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
      expect(() => deserializeClientPayload(null as any)).toThrow(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
      expect(() => deserializeClientPayload('short:format')).toThrow(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
      expect(() => deserializeClientPayload('otherprefix:1:2:3')).toThrow(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
    });
  });

  describe('Environment checks', () => {
    it('should throw if crypto.subtle is unavailable', async () => {
      const cryptoTarget = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
      const spy = vi.spyOn(cryptoTarget, 'subtle', 'get').mockReturnValue(undefined as any);

      await expect(generateClientKey()).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.UNSUPPORTED_ENVIRONMENT
      );

      spy.mockRestore();
    });
  });
});
