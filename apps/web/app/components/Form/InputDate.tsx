import { CalendarDays, Clock3 } from 'lucide-react';
import { useController, useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

type InputDateProps = Omit<
  React.ComponentProps<'input'>,
  'name' | 'onChange' | 'type' | 'value'
> & {
  label?: string;
  name: string;
  registerOptions?: RegisterOptions;
  defaultTime?: string;
};

const splitDateTime = (value?: string) => {
  if (!value) return { date: '', time: '' };

  const [date = '', rawTime = ''] = value.split('T');
  return {
    date,
    time: rawTime.slice(0, 5),
  };
};

const toDatePart = (value?: string | number) => {
  if (!value || typeof value !== 'string') return undefined;
  return splitDateTime(value).date || value;
};

export function InputDate({
  className,
  defaultTime = '09:00',
  disabled,
  id,
  label,
  max,
  min,
  name,
  registerOptions,
  required,
  ...props
}: InputDateProps) {
  const { control } = useFormContext();
  const rules: RegisterOptions = { ...(registerOptions ?? {}) };

  if (required && !rules.required) {
    rules.required = 'Informe data e horário.';
  }

  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    rules,
  });

  const fieldId = id || name;
  const { date, time } = splitDateTime(field.value);

  const updateValue = (nextDate: string, nextTime: string) => {
    if (!nextDate) {
      field.onChange('');
      return;
    }

    field.onChange(`${nextDate}T${nextTime || defaultTime}`);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      {label && (
        <Label htmlFor={`${fieldId}-date`} className="text-sm font-medium">
          {label}
        </Label>
      )}

      <div
        className={cn(
          'grid gap-2 rounded-xl border border-input bg-background/80 p-2 shadow-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 sm:grid-cols-[minmax(0,1fr)_8.5rem]',
          disabled && 'cursor-not-allowed opacity-60',
          error &&
            'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        )}
      >
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            {...props}
            id={`${fieldId}-date`}
            name={field.name}
            ref={field.ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className="h-10 w-full rounded-lg border-0 bg-muted/40 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground hover:bg-muted/60 focus:bg-background disabled:cursor-not-allowed"
            disabled={disabled}
            max={toDatePart(max)}
            min={toDatePart(min)}
            onBlur={field.onBlur}
            onChange={(event) => updateValue(event.target.value, time)}
            required={required}
            type="date"
            value={date}
          />
        </div>

        <div className="relative">
          <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            aria-invalid={!!error}
            aria-label={label ? `${label} - horário` : 'Horário'}
            className="h-10 w-full rounded-lg border-0 bg-muted/40 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground hover:bg-muted/60 focus:bg-background disabled:cursor-not-allowed"
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={(event) => updateValue(date, event.target.value)}
            required={required}
            type="time"
            value={time}
          />
        </div>
      </div>

      {error?.message && (
        <p
          id={`${fieldId}-error`}
          className="text-xs font-medium text-destructive"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}
