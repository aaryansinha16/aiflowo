import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Enter your first message to create a new chat. Our AI will automatically generate a title for your conversation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="message" className="text-sm font-medium">
              Your message
            </Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E.g., Book a flight to Paris..."
              className="mt-2"
              autoFocus
              disabled={isLoading}
              maxLength={500}
            />
            {message.length > 400 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {message.length}/500 characters
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Chat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

NewChatDialog.displayName = 'NewChatDialog';

export { NewChatDialog };
