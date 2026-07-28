/** @type {import('next').NextConfig} */
const nextConfig = {
  // @ayah/shared is a workspace package shipped as plain ESM source; let Next
  // transpile it like first-party code.
  transpilePackages: ["@ayah/shared"],
  // The marketing stylesheet is tiny. Inlining it removes a render-blocking
  // round trip on mobile while keeping the generated styles unchanged.
  experimental: {
    inlineCss: true,
  },
  // Once DNS points www at the deployment, consolidate every request onto the
  // canonical apex domain with a permanent redirect.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.ayah.academy" }],
        destination: "https://ayah.academy/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
