import type { NextConfig } from "next";

// basePath는 GitHub Pages 배포(프로덕션 빌드)에서만 적용
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/zoo" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
