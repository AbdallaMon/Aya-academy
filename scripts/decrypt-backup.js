#!/usr/bin/env node
// ===========================================================================
// Standalone (offline) backup-decryption tool — run by an admin without the server.
//
// Usage:
//   node scripts/decrypt-backup.js <path_to_.enc> <path_to_key_file> [out_.sql]
//
// Unlike the old single-master-key format, an Ayah backup is encrypted with a
// per-backup EncryptionKey whose 32-byte material lives on Drive as a .pem. To
// decrypt offline you must supply that key file (the .pem you saved, or a file
// containing the raw base64 key). The key file is decoded the same way the server
// decodes it (tolerates a .pem wrapper or raw base64) and asserted to be 32 bytes.
//
// It uses the same .enc container format as
// server/src/infra/backup/fileFormat.js — a guaranteed round-trip. The key buffer
// is zero-filled after use.
// ===========================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { decryptFromFileBuffer } from "../server/src/infra/backup/fileFormat.js";
import { decodeKeyMaterial } from "../server/src/infra/backup/keyMaterial.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fail(msg, code = 1) {
  // eslint-disable-next-line no-console
  console.error(`Error: ${msg}`);
  process.exit(code);
}

function usage() {
  return (
    "Usage:\n" +
    "  node scripts/decrypt-backup.js <path_to_.enc> <path_to_key_file> [out_.sql]\n" +
    "Example:\n" +
    `  node scripts/decrypt-backup.js .${path.sep}backups${path.sep}ayah-academy-2026-06-21-0200.enc .${path.sep}key.pem`
  );
}

function main() {
  void __dirname; // available for resolving sibling paths if needed.

  const inputPath = process.argv[2];
  const keyPath = process.argv[3];

  if (!inputPath) {
    fail(`You must pass the encrypted backup file path (.enc).\n${usage()}`);
  }
  if (!keyPath) {
    fail(`You must pass the encryption key file path (.pem or raw base64).\n${usage()}`);
  }
  if (!fs.existsSync(inputPath)) {
    fail(`File not found: ${inputPath}`);
  }
  if (!fs.existsSync(keyPath)) {
    fail(`Key file not found: ${keyPath}`);
  }

  // Decode the key material (tolerates a .pem wrapper or raw base64) + 32-byte assert.
  let keyBytes;
  try {
    const keyText = fs.readFileSync(keyPath, "utf8");
    keyBytes = decodeKeyMaterial(keyText);
  } catch (err) {
    fail(`Invalid key file — it must decode to exactly 32 bytes. (${err.message})`);
  }

  const outPath =
    process.argv[4] ||
    path.join(
      path.dirname(inputPath),
      path.basename(inputPath).replace(/\.enc$/i, "") + ".sql",
    );

  let plain;
  try {
    const fileBuffer = fs.readFileSync(inputPath);
    plain = decryptFromFileBuffer(fileBuffer, keyBytes);
  } catch (err) {
    fail(`Decryption failed — check the key is correct and the file is intact. (${err.message})`);
  } finally {
    // Zero-fill the key material after use (best-effort).
    try { keyBytes.fill(0); } catch { /* ignore */ }
  }

  try {
    fs.writeFileSync(outPath, plain);
  } catch (err) {
    fail(`Could not write the output file: ${err.message}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Decryption succeeded. Output file:\n  ${path.resolve(outPath)}`);
}

main();
