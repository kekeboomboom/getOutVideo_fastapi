import { fileURLToPath } from 'node:url';

import withBundleAnalyzer from '@next/bundle-analyzer';
import createJiti from 'jiti';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/libs/Env');

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isEnabled = value => value === '1' || value === 'true';

const getVideoApiBase = () => process.env.NEXT_PUBLIC_VIDEO_API_BASE?.replace(/\/$/, '');
const disableLintInDockerBuild = isEnabled(process.env.NEXT_DISABLE_ESLINT);
const disableTypecheckInDockerBuild = isEnabled(process.env.NEXT_DISABLE_TYPECHECK);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['.'],
    ignoreDuringBuilds: disableLintInDockerBuild,
  },
  typescript: {
    ignoreBuildErrors: disableTypecheckInDockerBuild,
  },
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const apiBase = getVideoApiBase();
    if (!apiBase) {
      return [];
    }

    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default bundleAnalyzer(nextConfig);
