import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

type InputFormProps = Omit<React.ComponentProps<'input'>, 'name'> & {
  label?: string;
  name: string;
  registerOptions?: RegisterOptions;
  containerClassName?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function InputForm({
  label,
  name,
  id,
  registerOptions,
  containerClassName,
  className,
  hint,
  leftIcon,
  rightIcon,
  required,
  ...props
}: InputFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldId = id ?? name;
  const error = errors[name];
  const errorMessage =
    error && typeof error.message === 'string' ? error.message : undefined;

  return (
    <div className={cn('grid gap-1.5', containerClassName)}>
      {label && (
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground">
            {leftIcon}
          </span>
        )}

        <Input
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={
            errorMessage
              ? `${fieldId}-error`
              : hint
                ? `${fieldId}-hint`
                : undefined
          }
          required={required}
          className={cn(
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-destructive focus-visible:ring-destructive/30',
            className,
          )}
          {...register(name, registerOptions)}
          {...props}
        />

        {rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>

      {errorMessage ? (
        <p
          id={`${fieldId}-error`}
          className="text-xs font-medium text-destructive"
        >
          {errorMessage}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
