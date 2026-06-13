'use client';

import { Loader2, Mail } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { FormField } from '@/components/molecules/FormField';
import { SocialLoginButtons } from '@/components/molecules/SocialLoginButtons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface LoginFormProps {
  onSubmit: (email: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onGithubLogin?: () => Promise<void>;
  /** Handler for the footer link that toggles between the login and signup screens. */
  onRegisterClick?: () => void;
  /** Switches the copy between sign-in and sign-up. Both share the same magic-link request. */
  variant?: 'login' | 'register';
  isLoading?: boolean;
}

const COPY = {
  login: {
    title: 'Welcome back',
    description: 'Enter your email to receive a magic link',
    togglePrompt: "Don't have an account?",
    toggleAction: 'Sign up',
  },
  register: {
    title: 'Create your account',
    description: "Enter your email and we'll send you a magic link to get started",
    togglePrompt: 'Already have an account?',
    toggleAction: 'Sign in',
  },
} as const;

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleLogin,
  onGithubLogin,
  onRegisterClick,
  variant = 'login',
  isLoading = false,
}) => {
  const copy = COPY[variant];
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    if (!email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await onSubmit(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormField
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            disabled={isLoading}
            required
            autoComplete="email"
            autoFocus
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send magic link
              </>
            )}
          </Button>

          {(onGoogleLogin || onGithubLogin) && (
            <SocialLoginButtons
              onGoogleLogin={onGoogleLogin}
              onGithubLogin={onGithubLogin}
              isLoading={isLoading}
            />
          )}

          {onRegisterClick && (
            <div className="text-center">
              <Text variant="muted" className="text-sm">
                {copy.togglePrompt}{' '}
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="text-primary hover:underline font-medium"
                >
                  {copy.toggleAction}
                </button>
              </Text>
            </div>
          )}

          <Text variant="muted" className="text-center text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </CardFooter>
      </form>
    </Card>
  );
};

LoginForm.displayName = 'LoginForm';

export { LoginForm };
