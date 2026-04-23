'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/en.json';
import ar from '@/i18n/ar.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: 'ar', // Default to Arabic to match layout
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;

export function setLanguage(lang) {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('qadsiah-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
