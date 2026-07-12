'use client';

import { useState } from 'react';
import { History, Calendar, BarChart2, Activity, Flame } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HistoryTab } from './HistoryTab';
import { CalendarTab } from './CalendarTab';
import { StatsTab } from './StatsTab';
import { TimelineTab } from './TimelineTab';
import { EditLogModal } from './EditLogModal';
import { DeleteLogConfirm } from './DeleteLogConfirm';
import type { Habit, HabitLog } from '@shared/types/api.types';

interface HabitHistorySheetProps {
  habit:   Habit | null;
  onClose: () => void;
}

export function HabitHistorySheet({ habit, onClose }: HabitHistorySheetProps) {
  const [editingLog,  setEditingLog]  = useState<HabitLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<HabitLog | null>(null);

  return (
    <>
      <Sheet open={Boolean(habit)} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg gap-0 p-0 flex flex-col">

          {/* ── Header ── */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              {habit?.icon && (
                <span
                  className="text-3xl leading-none"
                  style={habit.color ? { filter: 'drop-shadow(0 0 8px ' + habit.color + '40)' } : undefined}
                  aria-hidden
                >
                  {habit.icon}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base leading-snug">{habit?.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  {(habit?.currentStreak ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Flame className="h-3 w-3" aria-hidden />
                      {habit?.currentStreak}d streak
                    </span>
                  )}
                  {(habit?.currentStreak ?? 0) > 0 && (habit?.totalCompletions ?? 0) > 0 && (
                    <span className="text-muted-foreground/40">·</span>
                  )}
                  {(habit?.totalCompletions ?? 0) > 0 && (
                    <span>{habit?.totalCompletions} total</span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {habit && (
              <Tabs defaultValue="timeline">
                <TabsList className="w-full mb-5 grid grid-cols-4 h-10">
                  <TabsTrigger value="timeline" className="gap-1.5 text-xs font-medium">
                    <Activity className="h-3.5 w-3.5" aria-hidden />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-1.5 text-xs font-medium">
                    <History className="h-3.5 w-3.5" aria-hidden />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-1.5 text-xs font-medium">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="gap-1.5 text-xs font-medium">
                    <BarChart2 className="h-3.5 w-3.5" aria-hidden />
                    Stats
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                  <TimelineTab
                    habitId={habit.id}
                    customFields={habit.customFields}
                    onEditLog={setEditingLog}
                    onDeleteLog={setDeletingLog}
                  />
                </TabsContent>
                <TabsContent value="history">
                  <HistoryTab
                    habitId={habit.id}
                    customFields={habit.customFields}
                    onEditLog={setEditingLog}
                    onDeleteLog={setDeletingLog}
                  />
                </TabsContent>
                <TabsContent value="calendar">
                  <CalendarTab habitId={habit.id} />
                </TabsContent>
                <TabsContent value="stats">
                  <StatsTab habitId={habit.id} customFields={habit.customFields} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {habit && (
        <>
          <EditLogModal
            log={editingLog}
            habitId={habit.id}
            customFields={habit.customFields}
            onClose={() => setEditingLog(null)}
          />
          <DeleteLogConfirm
            log={deletingLog}
            habitId={habit.id}
            onClose={() => setDeletingLog(null)}
          />
        </>
      )}
    </>
  );
}
