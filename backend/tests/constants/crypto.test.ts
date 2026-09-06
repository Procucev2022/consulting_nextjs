import { describe, it, expect } from 'vitest';
import {
  AES_ALGORITHM,
  AES_KEY_LENGTH_BYTES,
  AES_IV_LENGTH_BYTES,
  AES_TAG_LENGTH_BYTES,
  PBKDF2_ITERATIONS,
  PBKDF2_DIGEST,
  DEFAULT_ENCRYPTION_ENCODING,
  DEFAULT_DEV_ENCRYPTION_KEY,
  SERIALIZED_PAYLOAD_PREFIX,
  CRYPTO_ERRORS
} from '../../src/constants/crypto';
import * as ConstantsIndex from '../../src/constants/index';

describe('Backend Crypto Constants', () => {
  it('should define industry-standard cryptographic parameters', () => {
    expect(AES_ALGORITHM).toBe('aes-256-gcm');
    expect(AES_KEY_LENGTH_BYTES).toBe(32);
    expect(AES_IV_LENGTH_BYTES).toBe(12);
    expect(AES_TAG_LENGTH_BYTES).toBe(16);
    expect(PBKDF2_ITERATIONS).toBe(100000);
    expect(PBKDF2_DIGEST).toBe('sha256');
    expect(DEFAULT_ENCRYPTION_ENCODING).toBe('hex');
    expect(SERIALIZED_PAYLOAD_PREFIX).toBe('aes256gcm');
    expect(DEFAULT_DEV_ENCRYPTION_KEY).toHaveLength(64);
  });

  it('should define structured error constants', () => {
    expect(CRYPTO_ERRORS.INVALID_KEY).toContain('32 bytes');
    expect(CRYPTO_ERRORS.INVALID_IV).toContain('12 bytes');
    expect(CRYPTO_ERRORS.INVALID_TAG).toContain('16 bytes');
    expect(CRYPTO_ERRORS.DECRYPTION_FAILED).toContain('Decryption failed');
    expect(CRYPTO_ERRORS.INVALID_PAYLOAD).toContain('Invalid encrypted payload');
  });

  it('should re-export via unified barrel', () => {
    expect(ConstantsIndex.AES_ALGORITHM).toBe(AES_ALGORITHM);
    expect(ConstantsIndex.AES_KEY_LENGTH_BYTES).toBe(AES_KEY_LENGTH_BYTES);
    expect(ConstantsIndex.CRYPTO_ERRORS).toEqual(CRYPTO_ERRORS);
  });
});
