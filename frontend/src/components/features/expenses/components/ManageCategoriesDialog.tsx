'use client';

import { useState } from 'react';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import {
  useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory,
} from '@/hooks/api/useExpenses';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@shared/types/api.types';

const SWATCHES = [
  '#6d60f0', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#3b82f6', '#f97316', '#ec4899',
] as const;

function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Choose a colour">
      {SWATCHES.map((hex) => (
        <button
          key={hex}
          type="button"
          aria-pressed={value === hex}
          aria-label={`Colour ${hex}`}
          onClick={() => onChange(hex)}
          className={cn(
            'h-6 w-6 rounded-full border-2 transition-transform',
            value === hex ? 'border-foreground scale-110' : 'border-transparent',
          )}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

type ActiveMode = { id: string; mode: 'editing' | 'deleting' } | null;

interface EditableRowProps {
  category:  ExpenseCategory;
  active:    ActiveMode;
  setActive: (v: ActiveMode) => void;
}

function EditableRow({ category, active, setActive }: EditableRowProps) {
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory  = useDeleteExpenseCategory();
  const [name,  setName]  = useState(category.name);
  const [color, setColor] = useState(category.color ?? SWATCHES[0]);

  const isEditing   = active?.id === category.id && active.mode === 'editing';
  const isDeleting  = active?.id === category.id && active.mode === 'deleting';

  function startEdit() {
    setName(category.name);
    setColor(category.color ?? SWATCHES[0]);
    setActive({ id: category.id, mode: 'editing' });
  }

  function save() {
    if (!name.trim()) return;
    updateCategory.mutate(
      { id: category.id, payload: { name: name.trim(), color } },
      { onSuccess: () => setActive(null) },
    );
  }

  function cancelEdit() {
    setName(category.name);
    setColor(category.color ?? SWATCHES[0]);
    setActive(null);
  }

  if (isDeleting) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <span className="text-sm text-muted-foreground">Delete &ldquo;{category.name}&rdquo;?</span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => deleteCategory.mutate(category.id, { onSuccess: () => setActive(null) })}
            loading={deleteCategory.isPending}
            aria-label={`Confirm delete ${category.name}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setActive(null)}
            aria-label="Cancel delete"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancelEdit(); }}
            maxLength={100}
            className="h-8 flex-1"
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-emerald-600 hover:text-emerald-600"
            onClick={save}
            disabled={!name.trim()}
            loading={updateCategory.isPending}
            aria-label="Save category"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={cancelEdit}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ColorSwatchPicker value={color} onChange={setColor} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: category.color ?? undefined }}
          aria-hidden
        />
        <span className="text-sm font-medium truncate">{category.name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={startEdit}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setActive({ id: category.id, mode: 'deleting' })}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={`Delete ${category.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ManageCategoriesDialogProps {
  open:    boolean;
  onClose: () => void;
}

export function ManageCategoriesDialog({ open, onClose }: ManageCategoriesDialogProps) {
  const { data: categories = [] } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const [newName,  setNewName]  = useState('');
  const [newColor, setNewColor] = useState<string>(SWATCHES[0]);
  const [active,   setActive]   = useState<ActiveMode>(null);

  function addCategory() {
    if (!newName.trim()) return;
    createCategory.mutate(
      { name: newName.trim(), color: newColor },
      { onSuccess: () => setNewName('') },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setActive(null); onClose(); } }}>
      <DialogContent className="max-w-sm" onEscapeKeyDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>Add, rename, recolour, or remove any category.</DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-border max-h-72 overflow-y-auto -mx-1 px-1">
          {categories.map((cat) => (
            <EditableRow key={cat.id} category={cat} active={active} setActive={setActive} />
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={100}
              className="h-8 flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
            />
            <Button
              type="button"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={addCategory}
              disabled={!newName.trim()}
              loading={createCategory.isPending}
              aria-label="Add category"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ColorSwatchPicker value={newColor} onChange={setNewColor} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
