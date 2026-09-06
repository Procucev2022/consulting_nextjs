/**
 * AES Cryptography Types and Interfaces (Frontend)
 * 
 * Standardized types for client-side encrypted payloads and encryption options.
 */

export interface ClientEncryptedPayload {
  algorithm: string;
  iv: string;
  tag: string;
  ciphertext: string;
  salt?: string;
}

export interface ClientEncryptionOptions {
  associatedData?: string;
}
