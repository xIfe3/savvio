'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar, SidebarProvider, MobileHeader } from '@/components/sidebar';
import { AppShellLoader, PageLoader } from '@/components/loading';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <AppShellLoader />;
  }

  if (!user) {
    return <PageLoader message="Redirecting..." />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:ml-60">
          <MobileHeader />
          <main className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
