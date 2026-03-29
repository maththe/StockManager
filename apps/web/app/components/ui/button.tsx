import * as React from 'react';
import { cn } from '~/lib/utils';

// Tailwind button classes
const buttonBase =
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const buttonVariants: Record<string, string> = {
  default: `${buttonBase} bg-primary text-primary-foreground hover:bg-primary/90`,
  outline: `${buttonBase} border border-input bg-background hover:bg-muted`,
  secondary: `${buttonBase} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  ghost: `${buttonBase} hover:bg-muted hover:text-foreground`,
  destructive: `${buttonBase} bg-destructive text-destructive-foreground hover:bg-destructive/90`,
  link: `${buttonBase} text-primary underline-offset-4 hover:underline bg-transparent`,
};

const sizeVariants: Record<string, string> = {
  default: 'h-8 px-2.5 gap-1.5',
  xs: 'h-6 px-2 text-xs gap-1',
  sm: 'h-7 px-2.5 text-[0.8rem] gap-1',
  lg: 'h-9 px-3 gap-1.5',
  icon: 'size-8',
  'icon-xs': 'size-6',
  'icon-sm': 'size-7',
  'icon-lg': 'size-9',
};

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof sizeVariants;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants[variant], sizeVariants[size], className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { Button };
