'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import * as React from 'react';

import { Spinner } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<VerificationStatus>('loading');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      // TODO: Replace with actual API call
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // try {
      //   const response = await fetch('/api/auth/verify', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ token }),
      //   });
      //
      //   if (!response.ok) {
      //     const data = await response.json();
      //     throw new Error(data.message || 'Verification failed');
      //   }
      //
      //   setStatus('success');
      //   setTimeout(() => router.push('/dashboard'), 2000);
      // } catch (err) {
      //   setStatus('error');
      //   setError(err instanceof Error ? err.message : 'Verification failed');
      // }

      // Simulated success
      setStatus('success');
      setTimeout(() => router.push('/'), 2000);
    };

    verifyToken();
  }, [searchParams, router]);

  const getContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-12 w-12 text-primary animate-spin" />,
          title: 'Verifying your email...',
          description: 'Please wait while we verify your magic link.',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
          title: 'Email verified!',
          description: 'Redirecting you to your dashboard...',
        };
      case 'expired':
        return {
          icon: <XCircle className="h-12 w-12 text-orange-500" />,
          title: 'Link expired',
          description: 'This magic link has expired. Please request a new one.',
        };
      case 'error':
        return {
          icon: <XCircle className="h-12 w-12 text-destructive" />,
          title: 'Verification failed',
          description: error || 'Something went wrong. Please try again.',
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-3">{content.icon}</div>
          </div>
          <CardTitle className="text-2xl text-center">{content.title}</CardTitle>
          <CardDescription className="text-center">{content.description}</CardDescription>
        </CardHeader>
        {(status === 'error' || status === 'expired') && (
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" onClick={() => router.push('/login')}>
              Back to login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-muted p-3">
                <Spinner size="lg" />
              </div>
            </div>
            <CardDescription className="text-center">Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
