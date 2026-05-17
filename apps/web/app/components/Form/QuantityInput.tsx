import type { ComponentProps, ReactNode } from 'react';
import { forwardRef } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Minus, Plus } from 'lucide-react';

import { cn } from '~/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const quantityFieldSizes = {
  default: {
    wrapper: 'rounded-2xl p-1.5',
    input: 'h-10 text-base',
    button: 'icon-sm' as const,
  },
  compact: {
    wrapper: 'rounded-xl p-1',
    input: 'h-9 text-sm',
    button: 'icon-xs' as const,
  },
  large: {
    wrapper: 'rounded-2xl p-1.5',
    input: 'h-12 text-lg',
    button: 'icon-sm' as const,
  },
};

const getNumericValue = (value: string | number) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const clampValue = (value: number, minimum?: number, maximum?: number) => {
  let nextValue = value;
  if (minimum !== undefined) nextValue = Math.max(minimum, nextValue);
  if (maximum !== undefined) nextValue = Math.min(maximum, nextValue);
  return nextValue;
};

type QuantityFieldProps = Omit<
  ComponentProps<'input'>,
  'className' | 'max' | 'min' | 'onChange' | 'size' | 'type' | 'value'
> & {
  value: string | number;
  minimum?: number;
  maximum?: number;
  step?: number;
  size?: keyof typeof quantityFieldSizes;
  className?: string;
  inputClassName?: string;
  showStepper?: boolean;
  decrementLabel?: string;
  incrementLabel?: string;
  onDecrement?: () => void;
  onIncrement?: () => void;
  onChange: (value: string) => void;
};

export const QuantityField = forwardRef<HTMLInputElement, QuantityFieldProps>(
  (
    {
      value,
      minimum,
      maximum,
      step = 1,
      size = 'default',
      className,
      inputClassName,
      disabled,
      showStepper = true,
      decrementLabel = 'Diminuir quantidade',
      incrementLabel = 'Aumentar quantidade',
      onDecrement,
      onIncrement,
      onChange,
      ...props
    },
    ref,
  ) => {
    const numericValue = getNumericValue(value);
    const styles = quantityFieldSizes[size];

    const stepValue = (direction: -1 | 1) => {
      const baseValue = numericValue ?? minimum ?? 0;
      const nextValue = clampValue(
        baseValue + direction * step,
        minimum,
        maximum,
      );
      onChange(String(nextValue));
    };

    const canDecrement =
      !disabled &&
      (numericValue === null ||
        minimum === undefined ||
        numericValue > minimum);
    const canIncrement =
      !disabled &&
      (numericValue === null ||
        maximum === undefined ||
        numericValue < maximum);

    return (
      <div
        className={cn(
          'flex w-full items-center border border-border/70 bg-muted/30',
          styles.wrapper,
          className,
        )}
      >
        {showStepper && (
          <Button
            type="button"
            variant="ghost"
            size={styles.button}
            onClick={onDecrement ?? (() => stepValue(-1))}
            disabled={!canDecrement}
            aria-label={decrementLabel}
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}

        <Input
          {...props}
          ref={ref}
          type="number"
          inputMode="numeric"
          min={minimum}
          max={maximum}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent text-center font-semibold shadow-none focus-visible:ring-0',
            styles.input,
            !showStepper && 'px-3',
            inputClassName,
          )}
        />

        {showStepper && (
          <Button
            type="button"
            variant="ghost"
            size={styles.button}
            onClick={onIncrement ?? (() => stepValue(1))}
            disabled={!canIncrement}
            aria-label={incrementLabel}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  },
);

QuantityField.displayName = 'QuantityField';

type QuantityFormFieldProps<TFieldValues extends FieldValues> = Omit<
  QuantityFieldProps,
  'name' | 'onChange' | 'value'
> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  containerClassName?: string;
};

export function QuantityFormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  containerClassName,
  id,
  ...props
}: QuantityFormFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name });
  const fieldId = id ?? field.name;
  const errorMessage = fieldState.error?.message;

  return (
    <div className={cn('grid gap-1.5', containerClassName)}>
      {label && (
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <QuantityField
        {...props}
        id={fieldId}
        name={field.name}
        ref={field.ref}
        value={field.value ?? 0}
        onBlur={field.onBlur}
        onChange={(value) => {
          const parsedValue = Number.parseInt(value, 10);
          field.onChange(Number.isNaN(parsedValue) ? 0 : parsedValue);
        }}
      />

      {errorMessage ? (
        <p className="text-xs font-medium text-destructive">{errorMessage}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type QuantityControlProps<T> = {
  eventItem: T & { id: string };
  draftValue: string | number;
  minimum: number;
  maximum: number;
  isDirty: boolean;
  error?: string | null;
  isSaving?: boolean;
  isBusy?: boolean;
  onStepQuantity: (eventItem: T, step: -1 | 1) => void;
  onDraftChange: (id: string, value: string) => void;
  onSaveQuantity: (eventItem: T) => void;
};

export function QuantityControl<T>({
  eventItem,
  draftValue,
  minimum,
  maximum,
  isDirty,
  error,
  isSaving = false,
  isBusy = false,
  onStepQuantity,
  onDraftChange,
  onSaveQuantity,
}: QuantityControlProps<T>) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <QuantityField
        value={draftValue}
        minimum={minimum}
        maximum={maximum}
        disabled={isBusy}
        className="max-w-xs"
        size="compact"
        onDecrement={() => onStepQuantity(eventItem, -1)}
        onIncrement={() => onStepQuantity(eventItem, 1)}
        onChange={(value) => onDraftChange(eventItem.id, value)}
      />

      <Button
        type="button"
        size="sm"
        className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 sm:w-auto"
        onClick={() => onSaveQuantity(eventItem)}
        disabled={!isDirty || Boolean(error) || isSaving || isBusy}
      >
        {isSaving ? 'Salvando...' : 'Salvar'}
      </Button>

      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
