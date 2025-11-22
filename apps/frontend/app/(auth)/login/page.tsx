'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { LoginForm } from '@/components/organisms/LoginForm';
import { MagicLinkSent } from '@/components/organisms/MagicLinkSent';

export default function LoginPage() {
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
      console.error('Failed to send magic link:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
    // window.location.href = '/api/auth/google';
  };

  const handleGithubLogin = async () => {
    // TODO: Implement GitHub OAuth
    console.log('GitHub login clicked');
    // window.location.href = '/api/auth/github';
  };

  const handleRegisterClick = () => {
    router.push('/register');
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
          onGoogleLogin={handleGoogleLogin}
          onGithubLogin={handleGithubLogin}
          onRegisterClick={handleRegisterClick}
          isLoading={isLoading}
        />
      ) : (
        <MagicLinkSent email={email} onResend={handleResend} onChangeEmail={handleChangeEmail} />
      )}
    </div>
  );
}
