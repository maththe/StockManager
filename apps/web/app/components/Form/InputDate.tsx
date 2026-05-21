import { CalendarDays, Clock3 } from 'lucide-react';
import { useController, useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';



const splitDateTime = (value?: string) => {
  if (!value) return { date: '', time: '' };
  const [date = '', rawTime = ''] = value.split('T');
  return { date, time: rawTime.slice(0, 5) };
};

const toDatePart = (value?: string | number) => {
  if (!value || typeof value !== 'string') return undefined;
  return splitDateTime(value).date || value;
};

export function InputDate({
  className,
  defaultTime = '09:00',
  disabled,
  endTimeName,
  id,
  label,
  max,
  min,
  name,
  registerOptions,
  required,
  ...props
}: any) {
  const { control } = useFormContext();
  const rules: RegisterOptions = { ...(registerOptions ?? {}) };

  if (required && !rules.required) {
    rules.required = 'Informe data e horário.';
  }

  const {
    field,
    fieldState: { error },
  } = useController({ control, name, rules });

  // Campo opcional de horário de término — só é registrado quando endTimeName existe.
  const endTimeController = useController({
    control,
    name: endTimeName ?? `${name}__endTime`,
  });
  const endTimeField = endTimeController.field;

  const fieldId = id || name;
  const { date, time } = splitDateTime(field.value);

  const updateValue = (nextDate: string, nextTime: string) => {
    if (!nextDate) {
      field.onChange('');
      return;
    }
    field.onChange(`${nextDate}T${nextTime || defaultTime}`);
  };

  const baseInput =
    'h-11 w-full rounded-xl border bg-background/80 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60';

  const focusRing =
    'focus:border-ring focus:ring-2 focus:ring-ring/30';

  const errorBorder = error
    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
    : 'border-input hover:border-ring/50';

  // Ajusta o grid: 2 colunas (data + início) ou 3 colunas (data + início + término).
  const gridCols = endTimeName
    ? 'grid-cols-[1fr_8rem_8rem]'
    : 'grid-cols-[1fr_9rem]';

  return (
    <div className={cn('grid gap-2', className)}>
      {label && (
        <Label htmlFor={`${fieldId}-date`} className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}

      <div className={cn('grid gap-2 sm:gap-3', gridCols)}>
        {/* Date field */}
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            {...props}
            id={`${fieldId}-date`}
            name={field.name}
            ref={field.ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(baseInput, focusRing, errorBorder, 'pl-10 pr-3', 'cursor-pointer')}
            disabled={disabled}
            max={toDatePart(max)}
            min={toDatePart(min)}
            onBlur={field.onBlur}
            onChange={(e) => updateValue(e.target.value, time)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            required={required}
            type="date"
            value={date}
          />
        </div>

        {/* Start time field */}
        <div className="relative">
          <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            aria-invalid={!!error}
            aria-label={label ? `${label} - horário de início` : 'Horário de início'}
            className={cn(baseInput, focusRing, errorBorder, 'pl-10 pr-2')}
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={(e) => updateValue(date, e.target.value)}
            required={required}
            type="time"
            value={time}
          />
        </div>

        {/* End time field (opcional) */}
        {endTimeName && (
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              id={`${fieldId}-endtime`}
              name={endTimeField.name}
              ref={endTimeField.ref}
              aria-label={label ? `${label} - horário de término` : 'Horário de término'}
              className={cn(baseInput, focusRing, errorBorder, 'pl-10 pr-2')}
              disabled={disabled}
              onBlur={endTimeField.onBlur}
              onChange={endTimeField.onChange}
              type="time"
              value={endTimeField.value ?? ''}
            />
          </div>
        )}
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