import { Loader2, Send, StopCircle } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onStop,
  placeholder = 'Send a message...',
  disabled = false,
  isLoading = false,
  maxLength = 2000,
  className,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring',
        disabled && 'opacity-50',
        className
      )}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        maxLength={maxLength}
        rows={1}
        className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />

      {/* Character Count */}
      {value.length > maxLength * 0.8 && (
        <div className="absolute -top-6 right-2 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Send/Stop Button */}
      {isLoading ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={onStop}
          className="h-9 w-9 flex-shrink-0 rounded-xl"
          title="Stop generating"
        >
          <StopCircle className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="h-9 w-9 flex-shrink-0 rounded-xl"
          title="Send message (Enter)"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      )}
    </div>
  );
};

ChatInput.displayName = 'ChatInput';

export { ChatInput };
