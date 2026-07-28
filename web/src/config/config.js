// Central runtime config. Values come from NEXT_PUBLIC_* env vars so they are
// available in the browser. No `dotenv` import here — Next.js inlines
// NEXT_PUBLIC_* at build time.

export const config = {
  api: {
    // e.g. http://localhost:4000/api/v1
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  web: {
    baseUrl: process.env.NEXT_PUBLIC_WEB_BASE_URL,
  },
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Ayah Academy",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  isDev: (process.env.NEXT_PUBLIC_APP_ENV ?? "development") === "development",
};
