import './globals.css';
import Providers from './providers';
import Header from '@/components/Header';

export const metadata = {
  title: 'القادسية فانتازي',
  description: 'كرة خيالية وتوقعات مباشرة — لجماهير القادسية.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
          <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-center text-xs text-white/40">
            © {new Date().getFullYear()} القادسية فانتازي
          </footer>
        </Providers>
      </body>
    </html>
  );
}
