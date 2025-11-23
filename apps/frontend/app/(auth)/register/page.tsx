'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { RegisterForm, type RegisterFormData } from '@/components/organisms/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const { useAuth } = await import('@/hooks/useAuth');
      await useAuth.getState().register(data);
      
      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
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

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm
        onSubmit={handleRegister}
        onGoogleLogin={handleGoogleLogin}
        onGithubLogin={handleGithubLogin}
        onLoginClick={handleLoginClick}
        isLoading={isLoading}
      />
    </div>
  );
}
