import { redirect } from 'next/navigation';

import { AppConfig } from '@/utils/AppConfig';

// Root not-found page - redirect to default locale with prefix
export default function RootNotFound() {
  redirect(`/${AppConfig.defaultLocale}`);
}
