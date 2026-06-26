import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/zoo',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
