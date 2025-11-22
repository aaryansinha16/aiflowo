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
  onRegisterClick?: () => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  onGoogleLogin,
  onGithubLogin,
  onRegisterClick,
  isLoading = false 
}) => {
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
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Enter your email to receive a magic link</CardDescription>
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
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
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
