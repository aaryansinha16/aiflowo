'use client';

import { Loader2, UserPlus } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { FormField } from '@/components/molecules/FormField';
import { SocialLoginButtons } from '@/components/molecules/SocialLoginButtons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onGithubLogin?: () => Promise<void>;
  onLoginClick?: () => void;
  isLoading?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onGoogleLogin,
  onGithubLogin,
  onLoginClick,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Partial<RegisterFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setErrors({ 
        email: err instanceof Error ? err.message : 'Registration failed' 
      });
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started with AI Flowo</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormField
            type="text"
            name="name"
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            disabled={isLoading}
            required
            autoComplete="name"
            autoFocus
          />

          <FormField
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            disabled={isLoading}
            required
            autoComplete="email"
          />

          <FormField
            type="password"
            name="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
            helperText="Must be at least 8 characters"
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create account
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

          {onLoginClick && (
            <div className="text-center">
              <Text variant="muted" className="text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </Text>
            </div>
          )}

          <Text variant="muted" className="text-center text-xs">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </CardFooter>
      </form>
    </Card>
  );
};

RegisterForm.displayName = 'RegisterForm';

export { RegisterForm };
