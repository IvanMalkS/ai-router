import { redirect } from 'next/navigation';
import { defaultLocale } from '@/shared/i18n/config';

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
