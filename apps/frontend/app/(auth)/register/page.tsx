'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { LoginForm } from '@/components/organisms/LoginForm';
import { MagicLinkSent } from '@/components/organisms/MagicLinkSent';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth:register');

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<'form' | 'sent'>('form');
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendMagicLink = async (emailAddress: string) => {
    setIsLoading(true);

    try {
      const { useAuth } = await import('@/hooks/useAuth');
      await useAuth.getState().sendMagicLink(emailAddress);

      setEmail(emailAddress);
      setStep('sent');
    } catch (error) {
      log.error('Failed to send magic link', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleResend = async () => {
    await handleSendMagicLink(email);
  };

  const handleChangeEmail = () => {
    setStep('form');
    setEmail('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {step === 'form' ? (
        <LoginForm
          variant="register"
          onSubmit={handleSendMagicLink}
          onRegisterClick={handleLoginClick}
          isLoading={isLoading}
        />
      ) : (
        <MagicLinkSent email={email} onResend={handleResend} onChangeEmail={handleChangeEmail} />
      )}
    </div>
  );
}
