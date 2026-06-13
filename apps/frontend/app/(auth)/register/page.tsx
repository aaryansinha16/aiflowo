'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { LoginForm } from '@/components/organisms/LoginForm';
import { MagicLinkSent } from '@/components/organisms/MagicLinkSent';
import { useAuth } from '@/hooks/useAuth';

/**
 * Sign up uses the same passwordless magic-link flow as login. The backend
 * find-or-creates the account when a magic link is requested, so a single
 * email field is all that's needed to register.
 */
export default function RegisterPage() {
  const router = useRouter();
  const sendMagicLink = useAuth((state) => state.sendMagicLink);
  const [step, setStep] = React.useState<'form' | 'sent'>('form');
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendMagicLink = async (emailAddress: string) => {
    setIsLoading(true);

    try {
      await sendMagicLink(emailAddress);

      setEmail(emailAddress);
      setStep('sent');
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
          onSubmit={handleSendMagicLink}
          onRegisterClick={handleLoginClick}
          isLoading={isLoading}
          title="Create your account"
          description="Enter your email and we'll send you a magic link to get started"
          footerPrompt="Already have an account?"
          footerActionLabel="Log in"
        />
      ) : (
        <MagicLinkSent email={email} onResend={handleResend} onChangeEmail={handleChangeEmail} />
      )}
    </div>
  );
}
