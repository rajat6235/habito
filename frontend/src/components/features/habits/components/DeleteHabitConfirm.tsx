'use client';

import { useDeleteHabit } from '@/hooks/api/useHabits';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Habit } from '@shared/types/api.types';

interface DeleteHabitConfirmProps {
  habit:   Habit | null;
  onClose: () => void;
}

export function DeleteHabitConfirm({ habit, onClose }: DeleteHabitConfirmProps) {
  const deleteHabit = useDeleteHabit();

  return (
    <Dialog open={Boolean(habit)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{habit?.title}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently remove the habit and all its logs. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            loading={deleteHabit.isPending}
            onClick={() => habit && deleteHabit.mutate(habit.id, { onSuccess: onClose })}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
