'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Flame, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { useRelapseHistory } from '@/hooks/api/useRecovery';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { buildStreakSegments, computeAverageStreakDays } from '../utils/timeline';
import { EditStartDateSheet } from './EditStartDateSheet';
import type { RecoveryGoal } from '@/lib/api/recovery.api';

interface RecoveryTimelineTabProps {
  goal: RecoveryGoal;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function EditableStatTile({ value, onEdit }: { value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit recovery start date (currently ${value})`}
      className="text-center p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/40 transition-colors"
    >
      <p className="text-lg font-bold tabular-nums flex items-center justify-center gap-1.5">
        {value}
        <Pencil className="h-3 w-3 text-muted-foreground" aria-hidden />
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">Recovery started</p>
    </button>
  );
}

export function RecoveryTimelineTab({ goal }: RecoveryTimelineTabProps) {
  const { data: relapses, isLoading } = useRelapseHistory(goal.id);
  const [editingStart, setEditingStart] = useState(false);

  const segments = useMemo(
    () => (relapses ? buildStreakSegments(goal, relapses) : []),
    [goal, relapses],
  );
  const averageDays = useMemo(() => computeAverageStreakDays(segments), [segments]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Longest streak (days)" value={goal.longestStreakDays} />
        <StatTile label="Total relapses" value={goal.totalRelapses} />
        <StatTile label="Average streak (days)" value={averageDays || '—'} />
        <EditableStatTile
          value={format(new Date(goal.startDate), 'MMM d, yyyy')}
          onEdit={() => setEditingStart(true)}
        />
      </div>

      {editingStart && (
        <EditStartDateSheet goal={goal} onClose={() => setEditingStart(false)} />
      )}

      <div>
        <p className="text-sm font-semibold mb-2.5">Recovery history</p>
        <div className="space-y-2.5">
          {[...segments].reverse().map((segment, i) => {
            const isCurrent = segment.status === 'current';
            return (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border',
                  isCurrent
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border bg-card',
                )}
              >
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                  isCurrent ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground',
                )}>
                  {isCurrent ? <Flame className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {format(segment.startDate, 'MMM d, yyyy')}
                    {' → '}
                    {segment.endDate ? format(segment.endDate, 'MMM d, yyyy') : 'Present'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs font-semibold', isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                      {segment.days} {segment.days === 1 ? 'day' : 'days'}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {isCurrent ? (
                        <>Current streak</>
                      ) : (
                        <><XCircle className="h-3 w-3" aria-hidden />Ended by relapse</>
                      )}
                    </span>
                  </div>
                  {segment.relapse?.triggers && segment.relapse.triggers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Triggers: {segment.relapse.triggers.join(', ')}
                    </p>
                  )}
                </div>
                {!isCurrent && segment.days >= 7 && (
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" aria-label="Meaningful progress before this relapse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
