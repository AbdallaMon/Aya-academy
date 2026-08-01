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
  // Optional recipient for the best-effort SMTP smoke test sent after the API
  // starts listening. Explicit opt-in: no e-mail is attempted when unset.
  devEmail: process.env.DEV_EMAIL?.trim() || undefined,
  // Public URL of the WEB app (used to build links inside emails, OAuth redirects,
  // etc.). Falls back to NEXT_PUBLIC_APP_URL so a single value in .env drives both.
  appUrl: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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
  // | "local" | "s3". No Settings model in Ayah — schedule time + retention come
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
    driveFolderName: process.env.GOOGLE_DRIVE_FOLDER_NAME || "Ayah Academy Backups",
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

  // SMTP e-mail — provider-agnostic, driven entirely by env. Works with ANY SMTP
  // server (Spacemail, Gmail, Mailgun, SES-SMTP, …); nothing here is tied to a
  // specific provider. Either set SMTP_URL as a full connection string, or the
  // discrete parts. `port` and `secure` are taken verbatim from env
  // (secure=true → implicit TLS, typically 465; false → STARTTLS, typically 587);
  // when SMTP_SECURE is omitted it's inferred from the port (465 ⇒ true).
  // Default OFF — until it's configured, sends are a no-op and (in dev) the link
  // is logged to the console so the flow stays testable.
  smtp: {
    url: process.env.SMTP_URL,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure:
      process.env.SMTP_SECURE !== undefined && process.env.SMTP_SECURE !== ""
        ? process.env.SMTP_SECURE === "true"
        : Number(process.env.SMTP_PORT ?? 587) === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    fromName: process.env.SMTP_FROM_NAME || "Ayah Academy",
    connectionTimeoutMs: Number(
      process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10000,
    ),
    greetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10000),
    socketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 20000),
    bootstrapTimeoutMs: Number(
      process.env.SMTP_BOOTSTRAP_TIMEOUT_MS ?? 15000,
    ),
    // Reject invalid TLS certs by default; opt out only for self-signed servers.
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  },

  // Meta WhatsApp Cloud API. Default OFF — no-op until enabled + configured.
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === "true",
    token: process.env.WHATSAPP_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_ID,
    templateName: process.env.WHATSAPP_TEMPLATE_INVOICE || "invoice_sent",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
    apiUrl: process.env.WHATSAPP_API_URL,
  },
};

/** Whether AWS S3 is fully configured (lazy client init only when present). */
export function isAwsConfigured() {
  return Boolean(
    ENV.aws.region && ENV.aws.bucket && ENV.aws.accessKeyId && ENV.aws.secretAccessKey,
  );
}

/** Whether WhatsApp Cloud API is fully configured (token + phoneId required). */
export function isWhatsAppConfigured() {
  return Boolean(ENV.whatsapp.token && ENV.whatsapp.phoneId);
}

/** Whether SMTP e-mail is configured — either a full SMTP_URL or host+user+pass. */
export function isSmtpConfigured() {
  return Boolean(ENV.smtp.url || (ENV.smtp.host && ENV.smtp.user && ENV.smtp.pass));
}
