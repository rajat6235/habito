'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CUSTOM_FIELD_TYPE_LABELS, type CustomFieldDef } from '@shared/types/customFields';

interface DynamicLogFieldsProps {
  fields: CustomFieldDef[];
}

// Rating stars component
function RatingInput({
  value,
  onChange,
  max = 5,
  fieldId,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  max?: number;
  fieldId: string;
}) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Rating">
      {stars.map(n => (
        <button
          key={n}
          type="button"
          aria-label={`${n} out of ${max}`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? 0 : n)}
          className={cn(
            'text-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
            n <= (value ?? 0) ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300',
          )}
          id={`${fieldId}-star-${n}`}
        >
          ★
        </button>
      ))}
      {value !== undefined && value > 0 && (
        <span className="text-xs text-muted-foreground ml-1">{value}/{max}</span>
      )}
    </div>
  );
}

// Multi-select checkbox list
function MultiSelectInput({
  options,
  value,
  onChange,
  fieldId,
}: {
  options:  string[];
  value:    string[] | undefined;
  onChange: (v: string[]) => void;
  fieldId:  string;
}) {
  const selected = value ?? [];
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  }
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            id={`${fieldId}-opt-${opt}`}
            checked={selected.includes(opt)}
            onCheckedChange={() => toggle(opt)}
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DynamicLogFields({ fields }: DynamicLogFieldsProps) {
  const { register, control, formState: { errors } } = useFormContext();

  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 pt-1 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Custom Fields
      </p>
      {fields.map(field => {
        const fieldPath = `customFieldValues.${field.id}`;
        const fieldErrors = (errors as Record<string, unknown>)?.[fieldPath];
        const inputId = `dyn-${field.id}`;

        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={inputId} className="text-sm">
              {field.name}
              {field.required && <span className="text-destructive ml-1" aria-hidden>*</span>}
              <span className="ml-1.5 text-xs text-muted-foreground/60 font-normal">
                {CUSTOM_FIELD_TYPE_LABELS[field.type]}
              </span>
            </Label>

            {/* ── Text ── */}
            {field.type === 'text' && (
              <Input
                id={inputId}
                placeholder={field.placeholder}
                defaultValue={field.defaultValue}
                className="h-9"
                {...register(fieldPath, {
                  required: field.required ? `${field.name} is required` : false,
                  maxLength: field.validation?.maxLength ? {
                    value:   field.validation.maxLength,
                    message: `Max ${field.validation.maxLength} characters`,
                  } : undefined,
                  minLength: field.validation?.minLength ? {
                    value:   field.validation.minLength,
                    message: `Min ${field.validation.minLength} characters`,
                  } : undefined,
                  pattern: field.validation?.pattern ? {
                    value:   new RegExp(field.validation.pattern),
                    message: 'Invalid format',
                  } : undefined,
                })}
              />
            )}

            {/* ── Long Text ── */}
            {field.type === 'long_text' && (
              <Textarea
                id={inputId}
                placeholder={field.placeholder}
                defaultValue={field.defaultValue}
                rows={3}
                {...register(fieldPath, {
                  required: field.required ? `${field.name} is required` : false,
                })}
              />
            )}

            {/* ── Number ── */}
            {field.type === 'number' && (
              <Input
                id={inputId}
                type="number"
                step="1"
                placeholder={field.placeholder}
                defaultValue={field.defaultValue}
                className="h-9"
                {...register(fieldPath, {
                  required:  field.required ? `${field.name} is required` : false,
                  valueAsNumber: true,
                  min: field.validation?.min !== undefined ? {
                    value:   field.validation.min,
                    message: `Minimum value is ${field.validation.min}`,
                  } : undefined,
                  max: field.validation?.max !== undefined ? {
                    value:   field.validation.max,
                    message: `Maximum value is ${field.validation.max}`,
                  } : undefined,
                })}
              />
            )}

            {/* ── Decimal ── */}
            {field.type === 'decimal' && (
              <Input
                id={inputId}
                type="number"
                step="any"
                placeholder={field.placeholder}
                defaultValue={field.defaultValue}
                className="h-9"
                {...register(fieldPath, {
                  required:  field.required ? `${field.name} is required` : false,
                  valueAsNumber: true,
                  min: field.validation?.min !== undefined ? {
                    value:   field.validation.min,
                    message: `Minimum value is ${field.validation.min}`,
                  } : undefined,
                  max: field.validation?.max !== undefined ? {
                    value:   field.validation.max,
                    message: `Maximum value is ${field.validation.max}`,
                  } : undefined,
                })}
              />
            )}

            {/* ── URL ── */}
            {field.type === 'url' && (
              <Input
                id={inputId}
                type="url"
                placeholder={field.placeholder ?? 'https://…'}
                defaultValue={field.defaultValue}
                className="h-9"
                {...register(fieldPath, {
                  required: field.required ? `${field.name} is required` : false,
                })}
              />
            )}

            {/* ── Date ── */}
            {field.type === 'date' && (
              <Input
                id={inputId}
                type="date"
                defaultValue={field.defaultValue}
                className="h-9"
                {...register(fieldPath, {
                  required: field.required ? `${field.name} is required` : false,
                })}
              />
            )}

            {/* ── Time ── */}
            {field.type === 'time' && (
              <Input
                id={inputId}
                type="time"
                defaultValue={field.defaultValue}
                className="h-9"
                {...register(fieldPath, {
                  required: field.required ? `${field.name} is required` : false,
                })}
              />
            )}

            {/* ── Checkbox ── */}
            {field.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <Controller
                  name={fieldPath}
                  control={control}
                  defaultValue={field.defaultValue === 'true'}
                  render={({ field: f }) => (
                    <Checkbox
                      id={inputId}
                      checked={Boolean(f.value)}
                      onCheckedChange={f.onChange}
                    />
                  )}
                />
                <Label htmlFor={inputId} className="text-sm font-normal cursor-pointer">
                  {field.placeholder ?? 'Yes'}
                </Label>
              </div>
            )}

            {/* ── Dropdown ── */}
            {field.type === 'dropdown' && (
              <Controller
                name={fieldPath}
                control={control}
                rules={{ required: field.required ? `${field.name} is required` : false }}
                render={({ field: f }) => (
                  <Select value={f.value as string ?? ''} onValueChange={f.onChange}>
                    <SelectTrigger id={inputId} className="h-9">
                      <SelectValue placeholder={field.placeholder ?? `Select ${field.name}…`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}

            {/* ── Multi-Select ── */}
            {field.type === 'multi_select' && (
              <Controller
                name={fieldPath}
                control={control}
                render={({ field: f }) => (
                  <MultiSelectInput
                    options={field.options ?? []}
                    value={f.value as string[] | undefined}
                    onChange={f.onChange}
                    fieldId={field.id}
                  />
                )}
              />
            )}

            {/* ── Rating ── */}
            {field.type === 'rating' && (
              <Controller
                name={fieldPath}
                control={control}
                rules={{ required: field.required ? `${field.name} is required` : false }}
                render={({ field: f }) => (
                  <RatingInput
                    value={f.value as number | undefined}
                    onChange={f.onChange}
                    max={field.validation?.max ?? 5}
                    fieldId={field.id}
                  />
                )}
              />
            )}

            {/* Validation error */}
            {Boolean(fieldErrors) && (
              <p className="text-xs text-destructive" role="alert">
                {typeof fieldErrors === 'object' && fieldErrors !== null && 'message' in fieldErrors
                  ? String((fieldErrors as { message?: string }).message)
                  : `${field.name} is invalid`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
