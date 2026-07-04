import type { Metadata } from 'next';
import { BarChart2 } from 'lucide-react';
import { ModulePreview } from '@/components/shared/ModulePreview';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <ModulePreview
      icon={<BarChart2 />}
      iconColor="bg-violet-500/10 text-violet-500"
      title="Analytics"
      description="Deep insights into your patterns. Understand when you perform best, which habits drive results, and where to focus next."
      features={[
        { icon: '📊', text: 'Habit heatmaps and streak analytics' },
        { icon: '📈', text: 'Weekly and monthly completion trends' },
        { icon: '🔬', text: 'Cross-module correlation analysis' },
        { icon: '📤', text: 'Export reports as PDF or CSV' },
      ]}
    />
  );
}
