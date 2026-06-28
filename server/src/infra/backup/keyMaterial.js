// ===========================================================================
// keyMaterial — pure helpers for backup-encryption key material (32-byte).
//
// Key material is NEVER stored in our DB — it is generated, written as a .pem
// file on Drive, and fetched on demand. Here only encode/decode + sha256
// fingerprint (no Prisma, no I/O).
// ===========================================================================

import crypto from "crypto";

const KEY_PEM_HEADER = "-----BEGIN AYA BACKUP KEY-----";
const KEY_PEM_FOOTER = "-----END AYA BACKUP KEY-----";

/** Generates a random 32-byte key. */
export function generateKeyBytes() {
  return crypto.randomBytes(32);
}

/** Key fingerprint: sha256(keyBytes) as hex (for display + verification). */
export function fingerprintOf(keyBytes) {
  return crypto.createHash("sha256").update(keyBytes).digest("hex");
}

/**
 * Decodes a key input to a Buffer and asserts it is exactly 32 bytes.
 * Tolerates a .pem wrapper (strips BEGIN/END lines + whitespace) or raw base64.
 * @param {string} input
 * @returns {Buffer} 32-byte
 * @throws if not 32 bytes after decode.
 */
export function decodeKeyMaterial(input) {
  const stripped = stripPem(input);
  let bytes;
  try {
    bytes = Buffer.from(stripped, "base64");
  } catch {
    bytes = Buffer.alloc(0);
  }
  if (bytes.length !== 32) {
    throw new Error("encryption key must decode to exactly 32 bytes");
  }
  return bytes;
}

/** Strips the .pem wrapper (BEGIN/END + blank lines) and returns clean base64. */
export function stripPem(input) {
  const text = String(input || "").trim();
  if (!text.includes(KEY_PEM_HEADER) && !text.includes(KEY_PEM_FOOTER)) {
    return text.replace(/\s+/g, "");
  }
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.includes("BEGIN") && !line.includes("END"))
    .join("")
    .replace(/\s+/g, "");
}

/** Builds a .pem file string from a base64 key (for writing to Drive). */
export function toPemString(keyBase64) {
  const b64 = String(keyBase64 || "").replace(/\s+/g, "");
  return `${KEY_PEM_HEADER}\n${b64}\n${KEY_PEM_FOOTER}\n`;
}

export { KEY_PEM_HEADER, KEY_PEM_FOOTER };
