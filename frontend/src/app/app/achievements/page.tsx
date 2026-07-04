import type { Metadata } from 'next';
import { Trophy } from 'lucide-react';
import { ModulePreview } from '@/components/shared/ModulePreview';

export const metadata: Metadata = { title: 'Achievements' };

export default function AchievementsPage() {
  return (
    <ModulePreview
      icon={<Trophy />}
      iconColor="bg-amber-500/10 text-amber-500"
      title="Achievements"
      description="Celebrate every win. Unlock badges, hit milestones, and see how far you've come on your journey to a better life."
      features={[
        { icon: '🏅', text: '50+ achievement badges to unlock' },
        { icon: '🔥', text: 'Streak milestones with special rewards' },
        { icon: '⭐', text: 'XP system and level progression' },
        { icon: '🏆', text: 'Leaderboard (optional, privacy-first)' },
      ]}
    />
  );
}
