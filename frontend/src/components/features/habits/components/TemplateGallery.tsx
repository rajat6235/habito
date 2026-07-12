'use client';

import { useState } from 'react';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  HABIT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type HabitTemplate,
} from '../habits.templates';
import type { CustomFieldDef } from '@shared/types/customFields';
import { CUSTOM_FIELD_TYPE_LABELS } from '@shared/types/customFields';

function newId(): string {
  return typeof crypto !== 'undefined'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

interface TemplateGalleryProps {
  open:     boolean;
  onClose:  () => void;
  onSelect: (template: HabitTemplate, fields: CustomFieldDef[]) => void;
}

export function TemplateGallery({ open, onClose, onSelect }: TemplateGalleryProps) {
  const [search,      setSearch]      = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [preview,     setPreview]     = useState<HabitTemplate | null>(null);

  const filtered = HABIT_TEMPLATES.filter(t => {
    const matchCat    = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function apply(template: HabitTemplate) {
    const fields: CustomFieldDef[] = template.fields.map(f => ({ ...f, id: newId() }));
    onSelect(template, fields);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Template Gallery
          </DialogTitle>
          <DialogDescription>
            Start from a template — every field is fully editable or deletable.
          </DialogDescription>
        </DialogHeader>

        {/* Search + category filter */}
        <div className="px-5 pt-4 pb-3 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Input
              className="pl-9 h-9"
              placeholder="Search templates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Template grid */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No templates match your search.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setPreview(template)}
                    className={cn(
                      'text-left rounded-xl border p-4 space-y-2 transition-all duration-150',
                      'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
                      preview?.id === template.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl" aria-hidden>{template.icon}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.slice(0, 3).map(f => (
                        <Badge key={f.name} variant="secondary" className="text-[9px] h-4 px-1">
                          {f.name}
                        </Badge>
                      ))}
                      {template.fields.length > 3 && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          +{template.fields.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview panel */}
          {preview && (
            <div className="w-64 shrink-0 border-l border-border bg-muted/20 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center space-y-1">
                  <div className="text-4xl">{preview.icon}</div>
                  <p className="font-semibold">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">{preview.description}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Custom Fields ({preview.fields.length})
                  </p>
                  {preview.fields.map(field => (
                    <div key={field.name} className="rounded-lg border border-border bg-card p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium">{field.name}</span>
                        {field.required && (
                          <span className="text-[9px] text-destructive">Required</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                          {CUSTOM_FIELD_TYPE_LABELS[field.type]}
                        </Badge>
                        {field.includeInAnalytics && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 text-emerald-600">
                            📊 Analytics
                          </Badge>
                        )}
                      </div>
                      {field.options && (
                        <p className="text-[10px] text-muted-foreground">
                          {field.options.slice(0, 3).join(', ')}
                          {field.options.length > 3 && `…+${field.options.length - 3}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border space-y-2 shrink-0">
                <Button className="w-full" size="sm" onClick={() => apply(preview)}>
                  Use {preview.name} template
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  All fields are editable after selection
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
