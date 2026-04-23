'use client';

import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { I18nextProvider } from 'react-i18next';
import i18n, { setLanguage } from '@/lib/i18n';
import { fetcher } from '@/lib/api';

export default function Providers({ children }) {
  useEffect(() => {
    // Only change language if different from current to prevent hydration mismatch
    const stored = (typeof window !== 'undefined' && localStorage.getItem('qadsiah-lang')) || 'ar';
    if (i18n.language !== stored) {
      setLanguage(stored);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
        {children}
      </SWRConfig>
    </I18nextProvider>
  );
}
