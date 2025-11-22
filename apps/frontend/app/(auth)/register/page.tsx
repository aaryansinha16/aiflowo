'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { RegisterForm, type RegisterFormData } from '@/components/organisms/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);

    // TODO: Replace with actual API call
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // try {
    //   const response = await fetch('/api/auth/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) {
    //     const error = await response.json();
    //     throw new Error(error.message || 'Registration failed');
    //   }
    //
    //   // Redirect to login or auto-login
    //   router.push('/login');
    // } catch (error) {
    //   throw error;
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulated success - redirect to login
    console.log('Registering user:', data);
    setIsLoading(false);
    router.push('/login');
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
