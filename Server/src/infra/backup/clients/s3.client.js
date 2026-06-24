// ===========================================================================
// S3 client (lazy + guarded) — built only when AWS settings are complete.
//
// IMPORTANT (boot-safe): importing this file must not break boot when AWS env is
// absent. So we do not create the client at load time — we build it on first
// actual use via getS3Client().
// ===========================================================================

import { ENV, isAwsConfigured } from "../../../config/env.js";

let _client = null;

/**
 * Returns a configured S3 client (cached). Throws if AWS is not configured —
 * called only from the S3 provider after provider=s3 is selected.
 */
export async function getS3Client() {
  if (_client) return _client;
  if (!isAwsConfigured()) {
    throw new Error("AWS S3 is not configured (region/bucket/accessKeyId/secretAccessKey)");
  }
  // Dynamic import: never load @aws-sdk unless S3 is actually used.
  const { S3Client } = await import("@aws-sdk/client-s3");
  _client = new S3Client({
    region: ENV.aws.region,
    credentials: {
      accessKeyId: ENV.aws.accessKeyId,
      secretAccessKey: ENV.aws.secretAccessKey,
    },
  });
  return _client;
}

export function getS3Bucket() {
  return ENV.aws.bucket;
}
