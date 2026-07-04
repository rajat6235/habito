import type { Metadata } from 'next';
import { HabitsView } from '@/components/features/habits/HabitsView';

export const metadata: Metadata = { title: 'Habits' };

export default function HabitsPage() {
  return <HabitsView />;
}
