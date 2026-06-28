import "dotenv/config";

function str(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const NODE_ENV = process.env.NODE_ENV ?? "development";

export const ENV = {
  NODE_ENV,
  IS_PROD: NODE_ENV === "production",
  PORT: Number(process.env.PORT ?? 4000),
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  cors: {
    origins: (process.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  },
  auth: {
    accessSecret: str("JWT_ACCESS_SECRET", "dev-access-secret"),
    refreshSecret: str("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "30d",
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  },

  // Master key (32-byte base64) — encrypts sensitive at-rest data (Drive OAuth
  // tokens). It does NOT encrypt DB backups (those use per-key EncryptionKey
  // material fetched from Drive). Read lazily by shared/crypto/crypto.js.
  masterKey: process.env.MASTER_KEY || process.env.ENCRYPTION_KEY,

  // Database connection parts (the adapter reads these; dump/restore reuse them).
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },

  // Backup destination + scheduler. Default "drive" (multi-account Google Drive)
  // | "local" | "s3". No Settings model in Aya — schedule time + retention come
  // from the env.
  backup: {
    provider: process.env.BACKUP_PROVIDER || "drive",
    // Start the auto-backup cron on boot. Disabled by default (CI/boot-safe).
    enabled: process.env.BACKUP_ENABLED === "true",
    // Optional external mysqldump binary (unused: dump.js is pure-node mysql2).
    mysqldumpBin: process.env.BACKUP_MYSQLDUMP_BIN || "mysqldump",
    // Daily auto-backup time "HH:mm".
    timeOfDay: process.env.BACKUP_TIME_OF_DAY || "02:00",
    // Local retention (how many newest successful backups keep their .enc file).
    retentionMax: parseInt(process.env.BACKUP_RETENTION_MAX || "200", 10),
    // Drive retention (how many newest remote files keep; absent = unlimited).
    driveRetentionMax:
      process.env.BACKUP_DRIVE_RETENTION_MAX !== undefined &&
      process.env.BACKUP_DRIVE_RETENTION_MAX !== ""
        ? parseInt(process.env.BACKUP_DRIVE_RETENTION_MAX, 10)
        : null,
    // Local directory for .enc files (absolute or relative to server cwd).
    dir: process.env.BACKUP_DIR || "backups",
    // S3 key prefix when provider=s3.
    s3Prefix: process.env.BACKUP_S3_PREFIX || "backups",
  },

  // Google OAuth + Drive (multi-account backup/key storage). Absent values do
  // not break boot — the Drive client throws DRIVE_NOT_CONFIGURED on first use.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    driveFolderName: process.env.GOOGLE_DRIVE_FOLDER_NAME || "Aya Academy Backups",
  },

  // AWS S3 (only used when backup.provider === "s3"). Lazy — never built unless used.
  aws: {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    prefix: process.env.AWS_S3_PREFIX || "",
  },
};

/** Whether AWS S3 is fully configured (lazy client init only when present). */
export function isAwsConfigured() {
  return Boolean(
    ENV.aws.region && ENV.aws.bucket && ENV.aws.accessKeyId && ENV.aws.secretAccessKey,
  );
}
