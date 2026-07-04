import type { Metadata } from 'next';
import { Dumbbell } from 'lucide-react';
import { ModulePreview } from '@/components/shared/ModulePreview';

export const metadata: Metadata = { title: 'Gym' };

export default function GymPage() {
  return (
    <ModulePreview
      icon={<Dumbbell />}
      iconColor="bg-blue-500/10 text-blue-500"
      title="Gym Tracker"
      description="Log every rep, track personal records, and watch your strength grow. Science-backed progressive overload made simple."
      features={[
        { icon: '🏋️', text: 'Workout builder with 500+ exercises' },
        { icon: '📈', text: 'Volume & PR tracking with progress charts' },
        { icon: '🔄', text: 'Program templates and custom routines' },
        { icon: '💪', text: 'Rest timer and 1RM calculator' },
      ]}
    />
  );
}
