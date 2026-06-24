// ===========================================================================
// AES-256-GCM encrypt/decrypt for sensitive data at-rest (e.g. Drive tokens).
//
// The key (MASTER_KEY) is base64 from the env (32 bytes after decode). We
// return/accept three parts: cipher + iv + tag (all base64). The key is read
// lazily so a missing MASTER_KEY does not break boot — the error is thrown only
// on the first actual use of encryption.
// ===========================================================================

import crypto from "crypto";
import { ENV } from "../../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM-recommended

function getKey() {
  const b64 = ENV.masterKey;
  if (!b64) {
    throw new Error("MASTER_KEY is not defined in env (.env)");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("MASTER_KEY must be 32 bytes (256-bit) after base64 decode");
  }
  return key;
}

/**
 * Encrypts a plaintext string.
 * @param {string} plaintext
 * @returns {{ cipher: string, iv: string, tag: string }} all base64
 */
export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cipher: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypts the three parts back to a plaintext string.
 * @param {{ cipher: string, iv: string, tag: string }} parts
 * @returns {string}
 */
export function decrypt({ cipher, iv, tag }) {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipher, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
