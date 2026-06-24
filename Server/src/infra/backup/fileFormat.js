// ===========================================================================
// Encrypted backup file (.enc) format — the single source of truth for the format.
//
// Format:
//   First line : JSON header followed by "\n" —
//                { v, alg, iv, tag, createdAt, keyId?, keyFingerprint? }
//                (iv/tag base64 — AES-256-GCM).
//   Rest       : the ciphertext, base64-encoded.
//
// Encryption uses an explicitly-passed 32-byte key (the EncryptionKey material
// fetched from Drive). MASTER_KEY no longer encrypts backups — it only encrypts
// Drive OAuth tokens at-rest (crypto.js). keyId/keyFingerprint in the header
// track which key encrypted the backup + allow verification.
// ===========================================================================

import crypto from "crypto";

const MAGIC_VERSION = 1;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM-recommended — matches shared/crypto/crypto.js
const TAG_LENGTH = 16; // GCM auth tag

/** Asserts the key is a 32-byte Buffer, else throws. */
function assertKeyBytes(keyBytes) {
  if (!Buffer.isBuffer(keyBytes) || keyBytes.length !== 32) {
    throw new Error("backup encryption key must be a 32-byte Buffer");
  }
  return keyBytes;
}

/**
 * Encrypts a Buffer and builds the whole .enc file content (header + body) with
 * a passed key.
 * @param {Buffer} plainBuffer
 * @param {Buffer} keyBytes  32-byte key (EncryptionKey material fetched from Drive).
 * @param {{ keyId?: number|string, keyFingerprint?: string }} [meta]
 * @returns {Buffer}
 */
export function encryptToFileBuffer(plainBuffer, keyBytes, meta = {}) {
  const key = assertKeyBytes(keyBytes);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  const header = {
    v: MAGIC_VERSION,
    alg: ALGORITHM,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    createdAt: new Date().toISOString(),
  };
  if (meta.keyId != null) header.keyId = meta.keyId;
  if (meta.keyFingerprint) header.keyFingerprint = meta.keyFingerprint;

  const headerLine = Buffer.from(JSON.stringify(header) + "\n", "utf8");
  const body = Buffer.from(encrypted.toString("base64"), "utf8");
  return Buffer.concat([headerLine, body]);
}

/**
 * Reads only the .enc file header (without decrypting) — to extract
 * keyId/keyFingerprint.
 * @param {Buffer} fileBuffer
 * @returns {{ v:number, alg:string, iv:string, tag:string, createdAt?:string, keyId?:number|string, keyFingerprint?:string }}
 */
export function readFileHeader(fileBuffer) {
  const newlineIdx = fileBuffer.indexOf(0x0a); // "\n"
  if (newlineIdx === -1) {
    // Technical English (log only) — the caller wraps it in a language-neutral code.
    throw new Error("invalid backup file format: missing header");
  }
  const headerJson = fileBuffer.slice(0, newlineIdx).toString("utf8");
  let header;
  try {
    header = JSON.parse(headerJson);
  } catch {
    throw new Error("invalid backup file format: corrupt JSON header");
  }
  if (!header || header.v !== MAGIC_VERSION || !header.iv || !header.tag) {
    throw new Error("unsupported backup file format or incomplete header");
  }
  return header;
}

/**
 * Decrypts the .enc file content and returns the original bytes (the .sql) with
 * a passed key.
 * @param {Buffer} fileBuffer
 * @param {Buffer} keyBytes  32-byte key (fetched from Drive or hand-entered for external restore).
 * @returns {Buffer}
 */
export function decryptFromFileBuffer(fileBuffer, keyBytes) {
  const header = readFileHeader(fileBuffer);
  const key = assertKeyBytes(keyBytes);

  // Integrity hardening: do not trust the alg coming from the file header (for
  // external restore it is attacker-supplied input). Hard-restrict it to
  // aes-256-gcm so the GCM auth-tag guarantee holds. Any other value throws a
  // technical English error wrapped by the caller as ENCRYPTION_KEY_INVALID /
  // RESTORE_EXTERNAL_DECRYPT_FAILED.
  if (header.alg != null && header.alg !== ALGORITHM) {
    throw new Error(`unsupported cipher algorithm in header: ${header.alg}`);
  }

  const iv = Buffer.from(header.iv, "base64");
  const tag = Buffer.from(header.tag, "base64");
  if (iv.length !== IV_LENGTH) {
    throw new Error("invalid IV length in backup header");
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error("invalid auth tag length in backup header");
  }

  const newlineIdx = fileBuffer.indexOf(0x0a);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const bodyB64 = fileBuffer.slice(newlineIdx + 1).toString("utf8");
  const cipherBytes = Buffer.from(bodyB64, "base64");
  return Buffer.concat([decipher.update(cipherBytes), decipher.final()]);
}

export { MAGIC_VERSION };
