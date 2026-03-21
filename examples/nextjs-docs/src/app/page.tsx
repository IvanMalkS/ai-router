'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { defaultLocale } from '@/shared/i18n/config';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${defaultLocale}`);
  }, [router]);
  return null;
}
