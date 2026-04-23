'use client';

import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';

export default function Providers({ children }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      {children}
    </SWRConfig>
  );
}
