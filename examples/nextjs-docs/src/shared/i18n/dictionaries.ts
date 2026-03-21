import type { Locale } from './config';

const dictionaries = {
  en: () => import('./locales/en.json').then((m) => m.default),
  ru: () => import('./locales/ru.json').then((m) => m.default),
  zh: () => import('./locales/zh.json').then((m) => m.default),
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
