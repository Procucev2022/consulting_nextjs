import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  generateClientKey,
  importHexKey,
  exportKeyToHex,
  encryptDataClient,
  decryptDataClient,
  serializeClientPayload,
  deserializeClientPayload
} from '../../src/utils/encryption';
import {
  CLIENT_AES_ALGORITHM,
  CLIENT_CRYPTO_ERRORS,
  DEFAULT_CLIENT_CRYPTO_PREFIX
} from '../../src/constants/crypto';

const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const TEST_IV = '0102030405060708090a0b0c';
const TEST_TAG = '0102030405060708090a0b0c0d0e0f10';

describe('Frontend Client-Side AES-GCM Encryption Utility', () => {
  it('generates a 256-bit AES-GCM CryptoKey and exports it to hex', async () => {
    const key = await generateClientKey();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe(CLIENT_AES_ALGORITHM);

    const hex = await exportKeyToHex(key);
    expect(hex).toHaveLength(64);

    const reimported = await importHexKey(hex);
    expect(reimported.algorithm.name).toBe(CLIENT_AES_ALGORITHM);
  });

  it('rejects imported keys with a wrong length or non-hex characters', async () => {
    await expect(importHexKey('abcd')).rejects.toThrow(CLIENT_CRYPTO_ERRORS.INVALID_KEY);
    await expect(importHexKey('g'.repeat(64))).rejects.toThrow(CLIENT_CRYPTO_ERRORS.INVALID_KEY);
  });

  describe('encryptDataClient & decryptDataClient', () => {
    it('encrypts and decrypts plaintext using an explicitly supplied key', async () => {
      const plaintext = 'Sensitive procurement supplier quote: ₹42,00,000';
      const encrypted = await encryptDataClient(plaintext, TEST_KEY);

      expect(encrypted.algorithm).toBe(CLIENT_AES_ALGORITHM);
      expect(encrypted.iv).toHaveLength(24);
      expect(encrypted.tag).toHaveLength(32);
      expect(encrypted.ciphertext.length).toBeGreaterThan(0);
      await expect(decryptDataClient(encrypted, TEST_KEY)).resolves.toBe(plaintext);
    });

    it('requires the caller to supply a key for both operations', async () => {
      const encrypted = await encryptDataClient('caller supplied key', TEST_KEY);
      const missingKey = undefined as unknown as string;

      await expect(encryptDataClient('plaintext', missingKey)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.MISSING_KEY
      );
      await expect(decryptDataClient(encrypted, missingKey)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.MISSING_KEY
      );
    });

    it('encrypts and decrypts using a custom key and associated data', async () => {
      const plaintext = 'Executive pricing model benchmark';
      const associatedData = 'tenant:global-enterprise';
      const encrypted = await encryptDataClient(plaintext, TEST_KEY, { associatedData });

      await expect(decryptDataClient(encrypted, TEST_KEY, { associatedData })).resolves.toBe(plaintext);
      await expect(
        decryptDataClient(encrypted, TEST_KEY, { associatedData: 'wrong:aad' })
      ).rejects.toThrow(CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED);
    });

    it('encrypts and decrypts using a generated CryptoKey object', async () => {
      const cryptoKey = await generateClientKey();
      const plaintext = 'Direct CryptoKey payload';
      const encrypted = await encryptDataClient(plaintext, cryptoKey);

      await expect(decryptDataClient(encrypted, cryptoKey)).resolves.toBe(plaintext);
    });

    it('rejects a CryptoKey with the wrong algorithm or missing operation usage', async () => {
      const wrongAlgorithm = {
        type: 'secret',
        algorithm: { name: 'AES-CBC', length: 256 },
        usages: ['encrypt']
      } as unknown as CryptoKey;
      await expect(encryptDataClient('plaintext', wrongAlgorithm)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.INVALID_KEY
      );

      const missingAlgorithm = { type: 'secret', usages: ['encrypt'] } as unknown as CryptoKey;
      await expect(encryptDataClient('plaintext', missingAlgorithm)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.INVALID_KEY
      );

      const invalidKeyLength = {
        type: 'secret',
        algorithm: { name: CLIENT_AES_ALGORITHM, length: 128 },
        usages: ['encrypt']
      } as unknown as CryptoKey;
      await expect(encryptDataClient('plaintext', invalidKeyLength)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.INVALID_KEY
      );

      const missingUsages = {
        type: 'secret',
        algorithm: { name: CLIENT_AES_ALGORITHM, length: 256 }
      } as unknown as CryptoKey;
      await expect(encryptDataClient('plaintext', missingUsages)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.INVALID_KEY
      );

      const encryptOnlyKey = await globalThis.crypto.subtle.generateKey(
        { name: CLIENT_AES_ALGORITHM, length: 256 },
        true,
        ['encrypt']
      );
      const validPayload = await encryptDataClient('plaintext', TEST_KEY);
      await expect(decryptDataClient(validPayload, encryptOnlyKey)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.INVALID_KEY
      );
    });

    it('automatically deserializes compact string representations during decrypt', async () => {
      const plaintext = 'Serialized string test';
      const encrypted = await encryptDataClient(plaintext, TEST_KEY);
      const serialized = serializeClientPayload(encrypted);

      await expect(decryptDataClient(serialized, TEST_KEY)).resolves.toBe(plaintext);
    });

    it('supports empty plaintext and an empty ciphertext field', async () => {
      const encrypted = await encryptDataClient('', TEST_KEY);
      expect(encrypted.ciphertext).toBe('');
      await expect(decryptDataClient(encrypted, TEST_KEY)).resolves.toBe('');
    });

    it('rejects ciphertext or authentication-tag tampering', async () => {
      const encrypted = await encryptDataClient('Authentic data', TEST_KEY);
      const tamperedCiphertext = {
        ...encrypted,
        ciphertext: (encrypted.ciphertext.startsWith('ff') ? '00' : 'ff') + encrypted.ciphertext.substring(2)
      };
      const tamperedTag = {
        ...encrypted,
        tag: (encrypted.tag.startsWith('00') ? 'ff' : '00') + encrypted.tag.substring(2)
      };

      await expect(decryptDataClient(tamperedCiphertext, TEST_KEY)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED
      );
      await expect(decryptDataClient(tamperedTag, TEST_KEY)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED
      );
    });

    it('logs and normalizes non-Error Web Crypto rejections', async () => {
      const encrypted = await encryptDataClient('valid payload', TEST_KEY);
      const decryptSpy = vi.spyOn(window.crypto.subtle, 'decrypt')
        .mockRejectedValueOnce('unexpected Web Crypto rejection');

      await expect(decryptDataClient(encrypted, TEST_KEY)).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED
      );
      expect(decryptSpy).toHaveBeenCalledOnce();
      decryptSpy.mockRestore();
    });

    it('rejects malformed payloads before decrypting', async () => {
      const malformedPayloads = [
        null,
        { algorithm: 'AES-CBC', iv: TEST_IV, tag: TEST_TAG, ciphertext: '00' },
        { algorithm: CLIENT_AES_ALGORITHM, iv: 'bad', tag: TEST_TAG, ciphertext: '00' },
        { algorithm: CLIENT_AES_ALGORITHM, iv: TEST_IV, tag: 'bad', ciphertext: '00' },
        { algorithm: CLIENT_AES_ALGORITHM, iv: TEST_IV, tag: TEST_TAG, ciphertext: 'not-hex' }
      ];

      for (const payload of malformedPayloads) {
        await expect(decryptDataClient(payload as never, TEST_KEY)).rejects.toThrow(
          CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD
        );
      }
    });
  });

  describe('serializeClientPayload and deserializeClientPayload', () => {
    it('serializes and deserializes a compact payload', () => {
      const payload = {
        algorithm: CLIENT_AES_ALGORITHM,
        iv: TEST_IV,
        tag: TEST_TAG,
        ciphertext: 'abcdef123456'
      };

      const serialized = serializeClientPayload(payload);
      expect(serialized).toBe(`${DEFAULT_CLIENT_CRYPTO_PREFIX}:${TEST_IV}:${TEST_TAG}:abcdef123456`);
      expect(deserializeClientPayload(serialized)).toEqual(payload);
    });

    it('rejects invalid payload data during serialization', () => {
      expect(() => serializeClientPayload({
        algorithm: CLIENT_AES_ALGORITHM,
        iv: 'bad',
        tag: TEST_TAG,
        ciphertext: '00'
      })).toThrow(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD);
    });

    it('rejects empty, malformed, or invalid-hex serialized values', () => {
      const invalidValues = [
        '',
        null,
        `${DEFAULT_CLIENT_CRYPTO_PREFIX}:${TEST_IV}:${TEST_TAG}`,
        `otherprefix:${TEST_IV}:${TEST_TAG}:00`,
        `${DEFAULT_CLIENT_CRYPTO_PREFIX}:not-hex:${TEST_TAG}:00`
      ];

      for (const serialized of invalidValues) {
        expect(() => deserializeClientPayload(serialized as never)).toThrow(
          CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD
        );
      }
    });
  });

  describe('Environment checks', () => {
    afterEach(() => vi.restoreAllMocks());

    it('throws when crypto.subtle is unavailable', async () => {
      const cryptoTarget = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
      vi.spyOn(cryptoTarget, 'subtle', 'get').mockReturnValue(undefined as unknown as SubtleCrypto);

      await expect(generateClientKey()).rejects.toThrow(
        CLIENT_CRYPTO_ERRORS.UNSUPPORTED_ENVIRONMENT
      );
    });
  });
});
