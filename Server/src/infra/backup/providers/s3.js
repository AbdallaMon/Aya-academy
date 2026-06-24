// ===========================================================================
// s3 provider — upload/download/delete the encrypted backup (.enc) on AWS S3.
//
// Reuses the lazy + guarded S3 client. The storage key is under ENV.backup.s3Prefix.
// Does not break boot when AWS env is absent (lazy).
// ===========================================================================

import { AppError } from "../../../shared/errors/AppError.js";
import { ENV } from "../../../config/env.js";
import { backupMessagesCodes, messagesNames } from "@aya/shared";
import { getS3Client, getS3Bucket } from "../clients/s3.client.js";

const TK = messagesNames.backupMessages;

function keyFor(fileName) {
  const prefix = (ENV.backup.s3Prefix || "backups").replace(/\/+$/, "");
  return `${prefix}/${fileName}`;
}

class S3BackupProvider {
  /** Uploads a local (encrypted) file and returns the storageKey. */
  async uploadFile(localPath, fileName) {
    try {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { createReadStream } = await import("fs");
      const client = await getS3Client();
      const bucket = getS3Bucket();
      const key = keyFor(fileName);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: createReadStream(localPath),
          ContentType: "application/octet-stream",
        }),
      );
      return key;
    } catch (err) {
      throw mapS3Error(err);
    }
  }

  /** Downloads a backup from S3 as a Buffer. */
  async downloadFile(storageKey) {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await getS3Client();
      const bucket = getS3Bucket();
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }));
      const chunks = [];
      for await (const chunk of res.Body) chunks.push(chunk);
      return Buffer.concat(chunks);
    } catch (err) {
      throw mapS3Error(err);
    }
  }

  /** Deletes a backup from S3 (retention). Does not throw if missing. */
  async deleteFile(storageKey) {
    if (!storageKey) return;
    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await getS3Client();
      const bucket = getS3Bucket();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
    } catch (err) {
      const status = err?.$metadata?.httpStatusCode;
      if (status === 404) return;
      throw mapS3Error(err);
    }
  }
}

function mapS3Error(err) {
  if (err instanceof AppError) return err;
  return new AppError({
    statusCode: 502,
    code: backupMessagesCodes.STORAGE_UPLOAD_FAILED,
    translationKey: TK,
    details: { error: err?.name || err?.message },
  });
}

export const s3BackupProvider = new S3BackupProvider();
export { S3BackupProvider };
