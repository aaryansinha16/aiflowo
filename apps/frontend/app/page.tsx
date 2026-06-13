'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Spinner } from '@/components/atoms';
import { useAuth } from '@/hooks/useAuth';

/**
 * Entry route. Sends unauthenticated visitors to the login/signup screen and
 * authenticated users straight to their dashboard, so the default route is the
 * auth flow rather than the component showcase.
 */
export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  React.useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </main>
  );
}
