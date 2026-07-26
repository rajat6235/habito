'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUpdateRecoveryGoal } from '@/hooks/api/useRecovery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toDatetimeLocalValue } from '../utils/datetime';
import type { RecoveryGoal } from '@/lib/api/recovery.api';

interface EditStartDateSheetProps {
  goal:    RecoveryGoal;
  onClose: () => void;
}

export function EditStartDateSheet({ goal, onClose }: EditStartDateSheetProps) {
  const updateGoal = useUpdateRecoveryGoal(goal.id);
  const [value, setValue] = useState(() => toDatetimeLocalValue(goal.startDate));

  async function handleSave() {
    if (!value) return;
    await updateGoal.mutateAsync({ startDate: new Date(value).toISOString() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full sm:max-w-md rounded-2xl bg-card border border-border p-6 space-y-5 shadow-2xl"
      >
        <div>
          <h3 className="font-bold text-lg">Edit start date</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Backdate {goal.name} to when you actually started.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recovery-edit-start">Started on</Label>
          <Input
            id="recovery-edit-start"
            type="datetime-local"
            value={value}
            max={toDatetimeLocalValue(new Date().toISOString())}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!value}
            loading={updateGoal.isPending}
          >
            Save
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
