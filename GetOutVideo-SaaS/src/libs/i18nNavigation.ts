import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

const routing = defineRouting({
  locales: AllLocales,
  defaultLocale: AppConfig.defaultLocale,
  localePrefix: AppConfig.localePrefix,
});

export const { usePathname, useRouter } = createNavigation(routing);
