'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Spinner } from '@/components/atoms';
import { useAuth } from '@/hooks/useAuth';

/**
 * Landing route. Sends visitors straight to the app: authenticated users go to
 * the dashboard, everyone else to login/signup. The component showcase now
 * lives at `/showcase`.
 */
export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);

  React.useEffect(() => {
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
