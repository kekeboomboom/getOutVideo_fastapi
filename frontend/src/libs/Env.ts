import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const skipValidation = process.env.SKIP_ENV_VALIDATION !== 'false' && process.env.SKIP_ENV_VALIDATION !== '0';

export const Env = createEnv({
  skipValidation,
  server: {
    LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_VIDEO_API_BASE: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VIDEO_API_BASE: process.env.NEXT_PUBLIC_VIDEO_API_BASE,
    NODE_ENV: process.env.NODE_ENV,
  },
});
