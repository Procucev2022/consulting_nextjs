# Mandatory AES Encryption & Secure Data Processing Policy

## 1. Cryptographic Primitive Standard
- **AES-256-GCM (Authenticated Encryption)**: All sensitive data at rest and in transit (confidential spend figures, pricing models, banking details, vendor credentials, tax identifiers) MUST be encrypted using AES-256-GCM.
- **AEAD Guarantees**: AES-GCM provides Authenticated Encryption with Associated Data, guaranteeing both confidentiality and cryptographic tamper-resistance via a 128-bit authentication tag.

## 2. Cryptographic Parameters & Nonce/IV Mandates
- **Key Length**: 256 bits (32 bytes). Keys must be sourced securely from environment variables (`APP_ENCRYPTION_KEY`) or derived via PBKDF2 with SHA-256 (minimum 100,000 iterations).
- **Initialization Vector (IV)**: MUST be a fresh, cryptographically secure 96-bit (12-byte) nonce generated for EVERY encryption operation (`crypto.randomBytes(12)` in Node.js or `crypto.getRandomValues` in browser). Nonce reuse with the same key is strictly prohibited.
- **Authentication Tag**: MUST be 128 bits (16 bytes). Decryption must strictly verify the authentication tag and immediately reject tampered or corrupted payloads.

## 3. Structured Payload Standard
- Encrypted payloads must use the standardized JSON schema:
  - `algorithm`: 'aes-256-gcm'
  - `iv`: Hex or Base64 encoded 12-byte initialization vector
  - `tag`: Hex or Base64 encoded 16-byte authentication tag
  - `ciphertext`: Hex or Base64 encoded encrypted data
  - `salt`: Optional hex or Base64 salt when key derivation is employed
- Serialized compact string representation follows: `aes256gcm:<iv>:<tag>:<ciphertext>`.

## 4. Constants & Types Isolation
- Cryptographic algorithm names, key/IV/tag lengths, iterations, and encoding defaults MUST reside in `constants/crypto.ts` and be re-exported via `constants/index.ts`.
- Encrypted payload types, crypto options, and interfaces MUST reside in `types/crypto.ts` and be re-exported via `types/index.ts`.
- Magic numbers, inline algorithm strings, or hardcoded keys are strictly prohibited.

## 5. Key Safety & Logging Policy
- Plaintext keys, passphrases, and raw secrets must NEVER be printed or recorded in logs.
- Centralized logger records must capture operation duration, algorithm, and payload identifier without exposing plaintext secrets.

## 6. Strict 90% Unit Test Code Coverage
- All cryptographic utilities, serializers, key derivation functions, and crypto routes must maintain at least **90% unit test code coverage** individually across statements, branches, functions, and lines (`perFile: true`).
