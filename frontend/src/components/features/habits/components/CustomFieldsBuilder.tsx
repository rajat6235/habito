'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABELS,
  NUMERIC_FIELD_TYPES,
  type CustomFieldDef,
  type CustomFieldType,
} from '@shared/types/customFields';

// ── Example presets ───────────────────────────────────────────────────────────
// These are suggestions only — never created automatically

interface ExamplePreset {
  label:  string;
  icon:   string;
  fields: Omit<CustomFieldDef, 'id'>[];
}

const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    label: 'Reading',
    icon:  '📚',
    fields: [
      { name: 'Book Name',    type: 'text',    placeholder: 'What are you reading?', showInHistory: true },
      { name: 'Pages Read',   type: 'number',  placeholder: 'e.g. 30',  showInHistory: true, includeInAnalytics: true },
      { name: 'Current Page', type: 'number',  placeholder: 'e.g. 120', showInHistory: true },
    ],
  },
  {
    label: 'Workout',
    icon:  '🏋️',
    fields: [
      { name: 'Workout Type', type: 'dropdown', options: ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Other'], showInHistory: true },
      { name: 'Duration (min)', type: 'number', placeholder: 'e.g. 45', showInHistory: true, includeInAnalytics: true },
      { name: 'Effort Rating',  type: 'rating',  validation: { min: 1, max: 5 }, showInHistory: true, includeInAnalytics: true },
    ],
  },
  {
    label: 'Running',
    icon:  '🏃',
    fields: [
      { name: 'Distance (km)', type: 'decimal', placeholder: 'e.g. 5.2', showInHistory: true, includeInAnalytics: true },
      { name: 'Duration (min)', type: 'number', placeholder: 'e.g. 30',  showInHistory: true, includeInAnalytics: true },
      { name: 'Avg Pace (min/km)', type: 'decimal', placeholder: 'e.g. 5.8', showInHistory: true },
    ],
  },
  {
    label: 'Meditation',
    icon:  '🧘',
    fields: [
      { name: 'Duration (min)', type: 'number',   placeholder: 'e.g. 10', showInHistory: true, includeInAnalytics: true },
      { name: 'Technique',      type: 'dropdown', options: ['Breath focus', 'Body scan', 'Visualization', 'Loving-kindness', 'Open awareness'], showInHistory: true },
      { name: 'Mood After',     type: 'rating',   validation: { min: 1, max: 5 }, showInHistory: true, includeInAnalytics: true },
    ],
  },
];

// ── Blank field template ──────────────────────────────────────────────────────

function blankField(): Omit<CustomFieldDef, 'id'> {
  return {
    name:               '',
    type:               'text',
    placeholder:        '',
    required:           false,
    showInHistory:      true,
    includeInAnalytics: false,
  };
}

function newId(): string {
  return typeof crypto !== 'undefined'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface CustomFieldsBuilderProps {
  value:    CustomFieldDef[];
  onChange: (fields: CustomFieldDef[]) => void;
}

// ── Single field editor ───────────────────────────────────────────────────────

interface FieldRowProps {
  field:     CustomFieldDef;
  onUpdate:  (updated: Partial<CustomFieldDef>) => void;
  onRemove:  () => void;
}

function FieldRow({ field, onUpdate, onRemove }: FieldRowProps) {
  const [expanded, setExpanded] = useState(false);
  const needsOptions = field.type === 'dropdown' || field.type === 'multi_select';
  const isNumeric    = NUMERIC_FIELD_TYPES.includes(field.type);

  const [optionsText, setOptionsText] = useState(field.options?.join(', ') ?? '');

  function commitOptions(text: string) {
    const opts = text.split(',').map(s => s.trim()).filter(Boolean);
    onUpdate({ options: opts.length > 0 ? opts : undefined });
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header row */}
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" aria-hidden />
        <button
          type="button"
          className="flex items-center gap-1 flex-1 min-w-0 text-left"
          onClick={() => setExpanded(x => !x)}
          aria-expanded={expanded}
        >
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className={cn('text-sm font-medium truncate', !field.name && 'text-muted-foreground italic')}>
            {field.name || 'Untitled field'}
          </span>
          <Badge variant="secondary" className="ml-1.5 text-[10px] shrink-0">
            {CUSTOM_FIELD_TYPE_LABELS[field.type]}
          </Badge>
          {field.required && (
            <span className="text-[10px] text-destructive ml-1 shrink-0" aria-label="required">*</span>
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={`Remove field ${field.name || 'untitled'}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-4 space-y-3 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div className="space-y-1">
              <Label className="text-xs">
                Field name <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                value={field.name}
                onChange={e => onUpdate({ name: e.target.value })}
                placeholder="e.g. Distance"
                className="h-8 text-sm"
                aria-required="true"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={field.type}
                onValueChange={v => onUpdate({ type: v as CustomFieldType })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_FIELD_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="text-sm">
                      {CUSTOM_FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Placeholder */}
          <div className="space-y-1">
            <Label className="text-xs">Placeholder (optional)</Label>
            <Input
              value={field.placeholder ?? ''}
              onChange={e => onUpdate({ placeholder: e.target.value || undefined })}
              placeholder="Hint shown inside the input…"
              className="h-8 text-sm"
            />
          </div>

          {/* Options (dropdown / multi_select) */}
          {needsOptions && (
            <div className="space-y-1">
              <Label className="text-xs">
                Options <span className="text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input
                value={optionsText}
                onChange={e => setOptionsText(e.target.value)}
                onBlur={e => commitOptions(e.target.value)}
                placeholder="Option A, Option B, Option C"
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Number validation */}
          {(isNumeric || field.type === 'number' || field.type === 'decimal') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min value</Label>
                <Input
                  type="number"
                  value={field.validation?.min ?? ''}
                  onChange={e => onUpdate({ validation: { ...field.validation, min: e.target.value !== '' ? Number(e.target.value) : undefined } })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max value</Label>
                <Input
                  type="number"
                  value={field.validation?.max ?? ''}
                  onChange={e => onUpdate({ validation: { ...field.validation, max: e.target.value !== '' ? Number(e.target.value) : undefined } })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Default value */}
          {field.type !== 'multi_select' && field.type !== 'dropdown' && (
            <div className="space-y-1">
              <Label className="text-xs">Default value (optional)</Label>
              <Input
                value={field.defaultValue ?? ''}
                onChange={e => onUpdate({ defaultValue: e.target.value || undefined })}
                placeholder="Pre-filled when logging…"
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={field.required ?? false}
                onCheckedChange={v => onUpdate({ required: Boolean(v) })}
              />
              <span className="text-xs">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={field.showInHistory ?? true}
                onCheckedChange={v => onUpdate({ showInHistory: Boolean(v) })}
              />
              <span className="text-xs">Show in history</span>
            </label>
            {isNumeric && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={field.includeInAnalytics ?? false}
                  onCheckedChange={v => onUpdate({ includeInAnalytics: Boolean(v) })}
                />
                <span className="text-xs">Include in analytics</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main builder component ────────────────────────────────────────────────────

export function CustomFieldsBuilder({ value: fields, onChange }: CustomFieldsBuilderProps) {
  const [examplesOpen, setExamplesOpen] = useState(false);

  function addField(template: Omit<CustomFieldDef, 'id'> = blankField()) {
    const newField: CustomFieldDef = { ...template, id: newId() };
    onChange([...fields, newField]);
  }

  function updateField(id: string, patch: Partial<CustomFieldDef>) {
    onChange(fields.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  function removeField(id: string) {
    onChange(fields.filter(f => f.id !== id));
  }

  function applyPreset(preset: ExamplePreset) {
    const newFields = preset.fields.map(f => ({ ...f, id: newId() }));
    onChange([...fields, ...newFields]);
    setExamplesOpen(false);
  }

  return (
    <div className="space-y-3">
      {/* Existing fields */}
      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map(field => (
            <FieldRow
              key={field.id}
              field={field}
              onUpdate={patch => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
            />
          ))}
        </div>
      )}

      {/* Add field button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 border-dashed"
        onClick={() => addField()}
      >
        <Plus className="h-3.5 w-3.5" />
        Add custom field
      </Button>

      {/* Examples section */}
      <div className="rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => setExamplesOpen(x => !x)}
          aria-expanded={examplesOpen}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="flex-1 text-left font-medium">Examples for inspiration</span>
          <span className="text-xs text-muted-foreground/60 mr-1">
            {examplesOpen ? 'Hide' : 'Show'}
          </span>
          {examplesOpen
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        </button>

        {examplesOpen && (
          <div className="border-t border-border p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              These are just ideas — you can ignore them or mix and match.
              None are created automatically.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_PRESETS.map(preset => (
                <div key={preset.label} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <span aria-hidden>{preset.icon}</span>
                      {preset.label}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs shrink-0"
                      onClick={() => applyPreset(preset)}
                    >
                      Add all
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {preset.fields.map(f => (
                      <li key={f.name} className="flex items-center justify-between gap-1">
                        <span className="text-xs text-muted-foreground truncate">{f.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">
                            {CUSTOM_FIELD_TYPE_LABELS[f.type]}
                          </Badge>
                          <button
                            type="button"
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => addField(f)}
                          >
                            + Add
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
