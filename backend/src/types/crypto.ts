/**
 * AES Cryptography Types and Interfaces (Backend)
 * 
 * Standardized types for encrypted payloads, crypto options, and operation results.
 */

export interface EncryptedDataPayload {
  algorithm: string;
  iv: string;
  tag: string;
  ciphertext: string;
  salt?: string;
}

export interface EncryptionOptions {
  encoding?: BufferEncoding;
  associatedData?: string;
  salt?: string;
}

export interface DecryptionOptions {
  encoding?: BufferEncoding;
  associatedData?: string;
}

export interface CryptoOperationResult {
  success: boolean;
  data?: string | EncryptedDataPayload;
  error?: string;
}

export interface EncryptRequestPayload {
  data: string;
  passphrase?: string;
  associatedData?: string;
}

export interface DecryptRequestPayload {
  payload: string | EncryptedDataPayload;
  passphrase?: string;
  associatedData?: string;
}
