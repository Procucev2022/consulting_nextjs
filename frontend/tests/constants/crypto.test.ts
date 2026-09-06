import { describe, it, expect } from 'vitest';
import {
  CLIENT_AES_ALGORITHM,
  CLIENT_AES_KEY_LENGTH_BITS,
  CLIENT_AES_IV_LENGTH_BYTES,
  CLIENT_AES_TAG_LENGTH_BITS,
  DEFAULT_CLIENT_CRYPTO_PREFIX,
  CLIENT_CRYPTO_ERRORS
} from '../../src/constants/crypto';
import * as ConstantsIndex from '../../src/constants/index';

describe('Frontend Crypto Constants', () => {
  it('should define client cryptographic parameters', () => {
    expect(CLIENT_AES_ALGORITHM).toBe('AES-GCM');
    expect(CLIENT_AES_KEY_LENGTH_BITS).toBe(256);
    expect(CLIENT_AES_IV_LENGTH_BYTES).toBe(12);
    expect(CLIENT_AES_TAG_LENGTH_BITS).toBe(128);
    expect(DEFAULT_CLIENT_CRYPTO_PREFIX).toBe('aes256gcm');
  });

  it('should define error constants', () => {
    expect(CLIENT_CRYPTO_ERRORS.UNSUPPORTED_ENVIRONMENT).toContain('Web Crypto API');
    expect(CLIENT_CRYPTO_ERRORS.INVALID_PAYLOAD).toContain('corrupted');
    expect(CLIENT_CRYPTO_ERRORS.DECRYPTION_FAILED).toContain('Client decryption failed');
  });

  it('should re-export via unified barrel', () => {
    expect(ConstantsIndex.CLIENT_AES_ALGORITHM).toBe(CLIENT_AES_ALGORITHM);
    expect(ConstantsIndex.CLIENT_AES_KEY_LENGTH_BITS).toBe(CLIENT_AES_KEY_LENGTH_BITS);
    expect(ConstantsIndex.CLIENT_CRYPTO_ERRORS).toEqual(CLIENT_CRYPTO_ERRORS);
  });
});
