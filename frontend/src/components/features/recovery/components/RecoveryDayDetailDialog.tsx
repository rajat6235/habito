'use client';

import { format } from 'date-fns';
import { Flame, XCircle, Ban } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import type { RecoveryDayInfo } from '../utils/timeline';

interface RecoveryDayDetailDialogProps {
  day:  Date | null;
  info: RecoveryDayInfo | null;
  onClose: () => void;
}

export function RecoveryDayDetailDialog({ day, info, onClose }: RecoveryDayDetailDialogProps) {
  return (
    <Dialog open={Boolean(day)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{day && format(day, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>

        {info?.status === 'before-start' && (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-2">
            <Ban className="h-4 w-4 shrink-0" aria-hidden />
            Before this recovery journey began.
          </div>
        )}

        {info?.status === 'relapse' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm font-medium text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              Relapse — ended a {info.dayNumber}-day streak
            </div>
            {info.relapse?.triggers && info.relapse.triggers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Triggers</p>
                <p className="text-sm">{info.relapse.triggers.join(', ')}</p>
              </div>
            )}
            {info.relapse?.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm">{info.relapse.notes}</p>
              </div>
            )}
            {info.relapse?.planForNext && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Plan for next time</p>
                <p className="text-sm">{info.relapse.planForNext}</p>
              </div>
            )}
          </div>
        )}

        {(info?.status === 'recovery' || info?.status === 'milestone') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Flame className="h-4 w-4 shrink-0" aria-hidden />
              Day {info.dayNumber} of the streak
            </div>
            {info.status === 'milestone' && (
              <DialogDescription className="mt-0">
                🎉 A milestone day — {info.dayNumber} days of consistency.
              </DialogDescription>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
