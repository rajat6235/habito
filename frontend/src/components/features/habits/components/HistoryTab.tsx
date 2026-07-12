'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { History, Pencil, Trash2, Search, Download } from 'lucide-react';
import { useHabitLogs } from '@/hooks/api/useHabits';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { statusColor, statusBg } from '../utils/habitUtils';
import type { HabitLog } from '@shared/types/api.types';
import type { CustomFieldDef } from '@shared/types/customFields';

interface HistoryTabProps {
  habitId:       string;
  customFields?: CustomFieldDef[];
  onEditLog:     (log: HabitLog) => void;
  onDeleteLog:   (log: HabitLog) => void;
}

type StatusFilter = 'all' | 'completed' | 'skipped' | 'failed';

function formatFieldValue(value: unknown, field: CustomFieldDef): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field.type === 'checkbox')     return Boolean(value) ? 'Yes' : 'No';
  if (field.type === 'multi_select') return Array.isArray(value) ? value.join(', ') : String(value);
  if (field.type === 'rating')       return `${value}/${field.validation?.max ?? 5} ★`;
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

function exportCSV(logs: HabitLog[], fields: CustomFieldDef[]) {
  const headers = ['Date', 'Status', 'Note', 'Value', ...fields.map(f => f.name)];
  const rows = logs.map(log => [
    log.logDate,
    log.status,
    log.note ?? '',
    log.value ?? '',
    ...fields.map(f => formatFieldValue(log.customFieldValues?.[f.id], f)),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `habit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function HistoryTab({ habitId, customFields = [], onEditLog, onDeleteLog }: HistoryTabProps) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visibleFields = customFields.filter(f => f.showInHistory !== false);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useHabitLogs(habitId);

  const allLogs = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);

  const filtered = useMemo(() => {
    return allLogs.filter(log => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const noteMatch = log.note?.toLowerCase().includes(q) ?? false;
        const dateMatch = log.logDate.includes(q);
        return noteMatch || dateMatch;
      }
      return true;
    });
  }, [allLogs, statusFilter, search]);

  const months = useMemo(() => groupByMonth(filtered), [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-2.5" aria-busy="true" aria-label="Loading logs">
        {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + filter toolbar */}
      {allLogs.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Input
              className="pl-9 h-8 text-sm"
              placeholder="Search notes or dates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['all', 'completed', 'skipped', 'failed'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-all',
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {s}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => exportCSV(filtered, customFields)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Export CSV"
            >
              <Download className="h-3 w-3" aria-hidden />
              CSV
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon={<History />}
          title={allLogs.length === 0 ? 'No logs yet' : 'No matching logs'}
          description={allLogs.length === 0
            ? 'Your habit logs will appear here.'
            : 'Try adjusting your search or filter.'}
          className="py-10 rounded-xl border border-border bg-muted/20"
        />
      )}

      {/* Grouped by month */}
      {months.map(({ label, logs }) => (
        <div key={label}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {label} · {logs.length}
          </p>
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card"
              >
                <div
                  className={cn('h-2 w-2 rounded-full shrink-0 mt-1.5', statusBg(log.status))}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {format(parseISO(log.logDate), 'EEE, MMM d, yyyy')}
                    </span>
                    <span className={cn('text-xs font-medium capitalize', statusColor(log.status))}>
                      {log.status}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.note}</p>
                  )}
                  {visibleFields.length > 0 && log.customFieldValues && Object.keys(log.customFieldValues).length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {visibleFields.map(field => {
                        const val = log.customFieldValues?.[field.id];
                        if (val === undefined || val === null || val === '') return null;
                        return (
                          <span key={field.id} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/70">{field.name}:</span>{' '}
                            {formatFieldValue(val, field)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {log.value !== null && log.value !== undefined && (
                      <span className="text-xs text-muted-foreground">Value: {log.value}</span>
                    )}
                    {log.completionCount > 1 && (
                      <span className="text-xs text-muted-foreground">{log.completionCount}× logged</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(log.loggedAt), 'h:mm a')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEditLog(log)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Edit log for ${format(parseISO(log.logDate), 'MMM d')}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteLog(log)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Delete log for ${format(parseISO(log.logDate), 'MMM d')}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
