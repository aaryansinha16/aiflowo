import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
      p: 'leading-7 [&:not(:first-child)]:mt-6',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      lead: 'text-xl text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'p',
  },
});

export interface TextProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'blockquote' | 'div';
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant = 'p', as, children, ...props }, ref) => {
    const elementType = as || (variant && variant.startsWith('h') ? variant : 'p');
    const classes = cn(textVariants({ variant, className }));

    // Explicit rendering based on element type to avoid hydration mismatch
    switch (elementType) {
      case 'h1':
        return <h1 ref={ref as React.Ref<HTMLHeadingElement>} className={classes} {...props}>{children}</h1>;
      case 'h2':
        return <h2 ref={ref as React.Ref<HTMLHeadingElement>} className={classes} {...props}>{children}</h2>;
      case 'h3':
        return <h3 ref={ref as React.Ref<HTMLHeadingElement>} className={classes} {...props}>{children}</h3>;
      case 'h4':
        return <h4 ref={ref as React.Ref<HTMLHeadingElement>} className={classes} {...props}>{children}</h4>;
      case 'span':
        return <span ref={ref as React.Ref<HTMLSpanElement>} className={classes} {...props}>{children}</span>;
      case 'blockquote':
        return <blockquote ref={ref as React.Ref<HTMLQuoteElement>} className={classes} {...props}>{children}</blockquote>;
      case 'div':
        return <div ref={ref as React.Ref<HTMLDivElement>} className={classes} {...props}>{children}</div>;
      default:
        return <p ref={ref as React.Ref<HTMLParagraphElement>} className={classes} {...props}>{children}</p>;
    }
  }
);

Text.displayName = 'Text';

export { Text, textVariants };
