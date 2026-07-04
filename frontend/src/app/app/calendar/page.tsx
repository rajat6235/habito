import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { ModulePreview } from '@/components/shared/ModulePreview';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <ModulePreview
      icon={<CalendarDays />}
      iconColor="bg-cyan-500/10 text-cyan-500"
      title="Calendar"
      description="See your entire life at a glance. Habits, workouts, journal entries, and goals — unified in one beautiful calendar view."
      features={[
        { icon: '📅', text: 'Month, week, and day views' },
        { icon: '🌈', text: 'Colour-coded events by module' },
        { icon: '🔄', text: 'Sync with external calendars' },
        { icon: '🔍', text: 'Heatmap view for habit consistency' },
      ]}
    />
  );
}
