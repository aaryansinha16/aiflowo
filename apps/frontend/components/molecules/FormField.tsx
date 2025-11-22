import * as React from 'react';

import { Text } from '@/components/atoms';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, containerClassName, className, ...props }, ref) => {
    const id = props.id || props.name;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label htmlFor={id} className="block">
            <Text variant="small" className="font-medium">
              {label}
              {props.required && <span className="text-destructive ml-1">*</span>}
            </Text>
          </label>
        )}
        <Input
          ref={ref}
          id={id}
          className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {error && (
          <Text variant="small" className="text-destructive" id={`${id}-error`}>
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text variant="muted" className="text-xs" id={`${id}-helper`}>
            {helperText}
          </Text>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
