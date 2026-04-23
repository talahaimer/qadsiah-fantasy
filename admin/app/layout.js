import './globals.css';
import Providers from './providers';
import AdminShell from '@/components/AdminShell';

export const metadata = { title: 'Qadsiah Admin', description: 'Internal operations dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </body>
    </html>
  );
}
