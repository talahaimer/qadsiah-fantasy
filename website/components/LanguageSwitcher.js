'use client';

import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const next = i18n.language === 'ar' ? 'en' : 'ar';
  return (
    <button
      className="btn-ghost !px-3 !py-1.5 text-sm"
      onClick={() => setLanguage(next)}
      aria-label="Toggle language"
    >
      <Globe size={16} />
      {next === 'ar' ? 'عربي' : 'EN'}
    </button>
  );
}
