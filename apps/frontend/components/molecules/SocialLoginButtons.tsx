'use client';

import { Github, Chrome, Loader2 } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { Button } from '@/components/ui/button';

export interface SocialLoginButtonsProps {
  onGoogleLogin?: () => Promise<void>;
  onGithubLogin?: () => Promise<void>;
  isLoading?: boolean;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleLogin,
  onGithubLogin,
  isLoading = false,
}) => {
  const [loadingProvider, setLoadingProvider] = React.useState<'google' | 'github' | null>(null);

  const handleSocialLogin = async (
    provider: 'google' | 'github',
    callback?: () => Promise<void>
  ) => {
    if (!callback) return;

    setLoadingProvider(provider);
    try {
      await callback();
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {onGoogleLogin && (
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('google', onGoogleLogin)}
            disabled={isLoading || loadingProvider !== null}
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="h-4 w-4" />
            )}
            <Text variant="small" className="ml-2">
              Google
            </Text>
          </Button>
        )}

        {onGithubLogin && (
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('github', onGithubLogin)}
            disabled={isLoading || loadingProvider !== null}
          >
            {loadingProvider === 'github' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            <Text variant="small" className="ml-2">
              GitHub
            </Text>
          </Button>
        )}
      </div>
    </div>
  );
};

SocialLoginButtons.displayName = 'SocialLoginButtons';

export { SocialLoginButtons };
