import type { ReactNode } from 'react';

import { Text } from '@/components/atoms';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <Text variant="large" className="font-bold">
              AI Flowo
            </Text>
          </div>
        </div>

        {/* Content */}
        <main>{children}</main>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4">
            <Text variant="muted" className="text-center text-xs">
              © 2025 AI Flowo. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
