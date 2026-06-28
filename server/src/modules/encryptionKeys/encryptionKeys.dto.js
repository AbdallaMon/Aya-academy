// encryptionKeys.dto — output shaping. No key material is leaked (it is never
// stored in our DB anyway). We expose the metadata + the key account's connection
// state (computed in the usecase).

/**
 * An encryption-key row.
 * @param {object} k  EncryptionKey row (with keyAccount included)
 * @param {{ connected?: boolean }} [extra]  key-account connection (computed in the usecase)
 */
function toKeyRow(k, extra = {}) {
  if (!k) return null;
  const account = k.keyAccount || null;
  const connected = Boolean(extra.connected);
  return {
    id: k.id,
    name: k.name,
    isPrimary: Boolean(k.isPrimary),
    fingerprint: k.fingerprint,
    driveFileId: k.driveFileId,
    createdAt: k.createdAt,
    keyAccount: account
      ? {
          id: account.id,
          email: account.email ?? null,
          label: account.label ?? null,
          type: account.type ?? null,
        }
      : null,
    connected,
    needsReconnect: !connected,
  };
}

function toList(rows, connectedMap = {}) {
  return rows.map((r) => toKeyRow(r, { connected: connectedMap[r.keyAccountId] }));
}

export const encryptionKeysDto = { toKeyRow, toList };
