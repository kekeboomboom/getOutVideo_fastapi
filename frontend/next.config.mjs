import { fileURLToPath } from 'node:url';

import withBundleAnalyzer from '@next/bundle-analyzer';
import createJiti from 'jiti';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/libs/Env');

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isEnabled = value => value === '1' || value === 'true';

const normalizeUrl = value => value?.replace(/\/$/, '');

const getVideoApiBase = () => {
  const configuredApiBase = normalizeUrl(process.env.NEXT_PUBLIC_VIDEO_API_BASE);
  const appUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (!configuredApiBase) {
    return undefined;
  }

  // Prevent rewrite loops when API base is accidentally set to the public app domain.
  if (appUrl && (configuredApiBase === appUrl || configuredApiBase.startsWith(`${appUrl}/`))) {
    return 'http://backend:8000';
  }

  return configuredApiBase;
};
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
