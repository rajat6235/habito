'use client';

import { Activity, Calendar, Flame } from 'lucide-react';
import { useRecoveryGoal } from '@/hooks/api/useRecovery';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RecoveryTimelineTab } from './RecoveryTimelineTab';
import { RecoveryCalendarTab } from './RecoveryCalendarTab';

interface RecoveryHistorySheetProps {
  goalId:  string | null;
  onClose: () => void;
}

export function RecoveryHistorySheet({ goalId, onClose }: RecoveryHistorySheetProps) {
  // Fetched live (not passed as a snapshot prop) so the sheet always reflects the latest
  // data — e.g. right after correcting the start date from within this same sheet.
  const { data: goal, isLoading } = useRecoveryGoal(goalId ?? '');

  return (
    <Sheet open={Boolean(goalId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg gap-0 p-0 flex flex-col">
        <SheetHeader className="px-5 pt-safe-or-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {goal?.icon && (
              <span
                className="text-3xl leading-none"
                style={goal.color ? { filter: 'drop-shadow(0 0 8px ' + goal.color + '40)' } : undefined}
                aria-hidden
              >
                {goal.icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-snug">{goal?.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 mt-0.5">
                <Flame className="h-3 w-3 text-amber-500" aria-hidden />
                {goal ? `${goal.currentStreakDays > 0 ? goal.currentStreakDays : '<1'} day${goal.currentStreakDays === 1 ? '' : 's'} — current streak` : ''}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-safe-or-6">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          )}
          {goal && (
            <Tabs defaultValue="timeline">
              <TabsList className="w-full mb-5 grid grid-cols-2 h-10">
                <TabsTrigger value="timeline" className="gap-1.5 text-xs font-medium">
                  <Activity className="h-3.5 w-3.5" aria-hidden />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  Calendar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <RecoveryTimelineTab goal={goal} />
              </TabsContent>
              <TabsContent value="calendar">
                <RecoveryCalendarTab goal={goal} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
