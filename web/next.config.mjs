/** @type {import('next').NextConfig} */
const nextConfig = {
  // @ayah/shared is a workspace package shipped as plain ESM source; let Next
  // transpile it like first-party code.
  transpilePackages: ["@ayah/shared"],
};

export default nextConfig;
