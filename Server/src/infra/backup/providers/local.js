// ===========================================================================
// local provider — keeps the encrypted backup (.enc) on disk only (backup.dir).
//
// backupService always writes the file locally before choosing a provider; with
// local there is no remote upload. Restore reads the local file directly (no
// remote download).
// ===========================================================================

class LocalBackupProvider {
  /** No remote upload — the backup is kept locally. storageKey = file name only. */
  async uploadFile(_localPath, fileName) {
    return fileName;
  }

  /** local does not download from a remote — restore reads disk in backupService. */
  async downloadFile() {
    return null;
  }

  /** Local retention is handled in backupService (deleting the file) — nothing remote. */
  async deleteFile() {
    /* no-op */
  }
}

export const localBackupProvider = new LocalBackupProvider();
export { LocalBackupProvider };
