/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aiflowo/shared', '@aiflowo/ui'],
  experimental: {
    optimizePackageImports: ['@aiflowo/shared', '@aiflowo/ui'],
  },
};

export default nextConfig;
