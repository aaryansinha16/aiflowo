'use client';

import { CheckCircle2, Mail } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface MagicLinkSentProps {
  email: string;
  onResend?: () => void;
  onChangeEmail?: () => void;
  isResending?: boolean;
}

const MagicLinkSent: React.FC<MagicLinkSentProps> = ({ email, onResend, onChangeEmail, isResending = false }) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Check your email</CardTitle>
        <CardDescription className="text-center">
          We&apos;ve sent a magic link to
          <br />
          <Text variant="small" className="font-medium text-foreground mt-1">
            {email}
          </Text>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <Text variant="small" className="font-medium">
                Click the link in your email
              </Text>
              <Text variant="muted" className="text-xs">
                The link will expire in 15 minutes for security reasons.
              </Text>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {onResend && (
          <Button variant="outline" className="w-full" onClick={onResend} disabled={isResending}>
            {isResending ? 'Resending...' : 'Resend magic link'}
          </Button>
        )}
        {onChangeEmail && (
          <Button variant="ghost" className="w-full" onClick={onChangeEmail}>
            Use a different email
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

MagicLinkSent.displayName = 'MagicLinkSent';

export { MagicLinkSent };
