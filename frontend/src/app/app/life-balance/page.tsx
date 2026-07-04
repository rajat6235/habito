import type { Metadata } from 'next';
import { Heart } from 'lucide-react';
import { ModulePreview } from '@/components/shared/ModulePreview';

export const metadata: Metadata = { title: 'Life Balance' };

export default function LifeBalancePage() {
  return (
    <ModulePreview
      icon={<Heart />}
      iconColor="bg-pink-500/10 text-pink-500"
      title="Life Balance"
      description="Visualise your life across 8 dimensions. Identify imbalances, set priorities, and build a life that feels truly whole."
      features={[
        { icon: '🕸️', text: 'Interactive radar chart across 8 life dimensions' },
        { icon: '📉', text: 'Weekly balance score and trend tracking' },
        { icon: '🎯', text: 'Focus area recommendations with action steps' },
        { icon: '📸', text: 'Weekly snapshots to compare over time' },
      ]}
    />
  );
}
