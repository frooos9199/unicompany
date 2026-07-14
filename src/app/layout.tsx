import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';
import MaintenancePage from '@/components/MaintenancePage';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'UniCompany - منصة الكفاءات والشركات',
  description: 'منصة احترافية تربط أصحاب المهارات بالشركات الرائدة حول العالم',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${cairo.variable} ${inter.variable} antialiased`}>
        {process.env.NEXT_PUBLIC_MAINTENANCE === 'true' ? (
          <MaintenancePage />
        ) : (
          <AuthProvider>
            {children}
          </AuthProvider>
        )}
      </body>
    </html>
  );
}
