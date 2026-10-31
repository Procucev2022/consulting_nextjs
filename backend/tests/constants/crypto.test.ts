import { describe, expect, it } from 'vitest';
import { AES_GCM_CONFIG, CRYPTO_MESSAGES } from '../../src/constants/crypto';

describe('AES-GCM configuration', () => {
  it('defines the Worker-compatible AES-256-GCM parameters', () => {
    expect(AES_GCM_CONFIG).toEqual({
      ALGORITHM: 'AES-GCM', IDENTIFIER: 'aes-256-gcm', KEY_BYTES: 32, IV_BYTES: 12, TAG_BITS: 128, TAG_BYTES: 16
    });
    expect(CRYPTO_MESSAGES.missingKey).toContain('APP_ENCRYPTION_KEY');
    expect(CRYPTO_MESSAGES.invalidPayload).toContain('assessment artifact');
  });
});
