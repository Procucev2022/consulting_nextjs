export const AES_GCM_CONFIG = Object.freeze({
  ALGORITHM: 'AES-GCM',
  IDENTIFIER: 'aes-256-gcm',
  KEY_BYTES: 32,
  IV_BYTES: 12,
  TAG_BITS: 128,
  TAG_BYTES: 16
});

export const CRYPTO_MESSAGES = Object.freeze({
  missingKey: 'APP_ENCRYPTION_KEY must be configured with exactly 32 UTF-8 bytes before assessment artifacts can be stored.',
  invalidPayload: 'The stored assessment artifact is incomplete or could not be decrypted.'
});
