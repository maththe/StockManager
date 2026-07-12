import { Controller, useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';

import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFormProps = {
  label?: string;
  name: string;
  id?: string;
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  registerOptions?: RegisterOptions;
  className?: string;
  containerClassName?: string;
  hint?: string;
};

export function SelectForm({
  label,
  name,
  id,
  options = [],
  placeholder = 'Selecione...',
  required,
  disabled,
  registerOptions,
  className,
  containerClassName,
  hint,
}: SelectFormProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const fieldId = id ?? name;
  const error = errors[name];
  const errorMessage =
    error && typeof error.message === 'string' ? error.message : undefined;

  const rules: RegisterOptions = { ...(registerOptions ?? {}) };
  if (required && !rules.required) {
    rules.required = 'Selecione uma opção.';
  }

  return (
    <div className={cn('grid gap-1.5', containerClassName)}>
      {label && (
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field }) => (
          <Select
            value={field.value ? String(field.value) : undefined}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={fieldId}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={!!error}
              aria-describedby={
                errorMessage
                  ? `${fieldId}-error`
                  : hint
                    ? `${fieldId}-hint`
                    : undefined
              }
              className={cn(
                error && 'border-destructive focus-visible:ring-destructive/30',
                className,
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.length === 0 ? (
                <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      />

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
