import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/toast';
import { ServiceWorkerRegistrar } from '@/components/sw-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'Savvio — Smart Expense Tracker',
  description: 'Track your expenses, manage budgets, and gain financial insights',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Savvio',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            <ServiceWorkerRegistrar />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
