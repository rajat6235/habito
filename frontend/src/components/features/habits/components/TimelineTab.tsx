'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Pencil, Trash2, Activity } from 'lucide-react';
import { useHabitLogs } from '@/hooks/api/useHabits';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { statusColor, statusBg } from '../utils/habitUtils';
import type { HabitLog } from '@shared/types/api.types';
import type { CustomFieldDef } from '@shared/types/customFields';

interface TimelineTabProps {
  habitId:       string;
  customFields?: CustomFieldDef[];
  onEditLog:     (log: HabitLog) => void;
  onDeleteLog:   (log: HabitLog) => void;
}

const STATUS_ICON: Record<string, string> = {
  completed: '✅',
  skipped:   '⏭️',
  failed:    '❌',
};

function formatFieldValue(value: unknown, field: CustomFieldDef): string {
  if (value === undefined || value === null || value === '') return '';
  if (field.type === 'checkbox')     return String(Boolean(value) ? 'Yes' : 'No');
  if (field.type === 'multi_select') return Array.isArray(value) ? value.join(', ') : String(value);
  if (field.type === 'rating')       return `${'★'.repeat(Math.round(Number(value) || 0))} (${value}/${field.validation?.max ?? 5})`;
  if (field.type === 'date') {
    try { return format(parseISO(String(value)), 'MMM d, yyyy'); } catch { return String(value); }
  }
  return String(value);
}

function groupByMonth(logs: HabitLog[]): { label: string; logs: HabitLog[] }[] {
  const groups = new Map<string, HabitLog[]>();
  for (const log of logs) {
    const key = format(parseISO(log.logDate), 'MMMM yyyy');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }
  return Array.from(groups.entries()).map(([label, logs]) => ({ label, logs }));
}

export function TimelineTab({ habitId, customFields = [], onEditLog, onDeleteLog }: TimelineTabProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useHabitLogs(habitId);
  const logs = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const months = useMemo(() => groupByMonth(logs), [logs]);
  const visibleFields = customFields.filter(f => f.showInHistory !== false);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<Activity />}
        title="No logs yet"
        description="Your habit timeline will appear here once you start logging."
        className="py-10 rounded-xl border border-border bg-muted/20"
      />
    );
  }

  return (
    <div className="space-y-6">
      {months.map(({ label, logs: monthLogs }) => (
        <div key={label}>
          {/* Month header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {label} <span className="font-normal">· {monthLogs.length} log{monthLogs.length > 1 ? 's' : ''}</span>
            </p>
          </div>

          {/* Timeline entries */}
          <div className="relative pl-5">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />

            <div className="space-y-3">
              {monthLogs.map(log => {
                const customValues = visibleFields
                  .map(f => ({ field: f, formatted: formatFieldValue(log.customFieldValues?.[f.id], f) }))
                  .filter(({ formatted }) => formatted !== '');

                return (
                  <div key={log.id} className="relative group">
                    {/* Dot on timeline */}
                    <div
                      className={cn(
                        'absolute -left-5 top-3.5 h-3.5 w-3.5 rounded-full border-2 border-background transition-transform group-hover:scale-110',
                        statusBg(log.status),
                      )}
                      aria-hidden
                    />

                    <div className={cn(
                      'rounded-xl border bg-card p-3.5 transition-all',
                      'hover:shadow-sm hover:border-border/80',
                      log.status === 'completed' ? 'border-border' :
                      log.status === 'skipped'   ? 'border-amber-200/60 dark:border-amber-800/30' :
                                                   'border-red-200/60 dark:border-red-800/30',
                    )}>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden>{STATUS_ICON[log.status] ?? '•'}</span>
                          <div>
                            <p className="text-sm font-semibold leading-none">
                              {format(parseISO(log.logDate), 'EEE, MMM d')}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn('text-[10px] font-medium capitalize', statusColor(log.status))}>
                                {log.status}
                              </span>
                              {log.completionCount > 1 && (
                                <span className="text-[10px] text-muted-foreground">{log.completionCount}× logged</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditLog(log)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label={`Edit ${format(parseISO(log.logDate), 'MMM d')}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDeleteLog(log)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Delete ${format(parseISO(log.logDate), 'MMM d')}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Note */}
                      {log.note && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          &ldquo;{log.note}&rdquo;
                        </p>
                      )}

                      {/* Custom field values */}
                      {customValues.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-border/50 grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {customValues.map(({ field, formatted }) => (
                            <div key={field.id}>
                              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">{field.name}</p>
                              <p className="text-xs font-medium text-foreground">{formatted}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Logged-at time */}
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground/60" aria-hidden />
                        <span className="text-[9px] text-muted-foreground/60">
                          {format(parseISO(log.loggedAt), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={() => fetchNextPage()}
          loading={isFetchingNextPage}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
