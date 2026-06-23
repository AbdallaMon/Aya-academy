import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @aya/shared is a workspace package shipped as plain ESM source; let Next
  // transpile it like first-party code.
  transpilePackages: ["@aya/shared"],
};

export default nextConfig;
