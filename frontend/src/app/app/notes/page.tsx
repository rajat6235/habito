import type { Metadata } from 'next';
import { StickyNote } from 'lucide-react';
import { ModulePreview } from '@/components/shared/ModulePreview';

export const metadata: Metadata = { title: 'Notes' };

export default function NotesPage() {
  return (
    <ModulePreview
      icon={<StickyNote />}
      iconColor="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500"
      title="Notes"
      description="A fast, beautiful space for your ideas, learnings, and thoughts. Tag, search, and connect your knowledge effortlessly."
      features={[
        { icon: '✍️', text: 'Rich text editor with markdown support' },
        { icon: '🏷️', text: 'Tag-based organisation and filtering' },
        { icon: '🔍', text: 'Full-text search across all notes' },
        { icon: '📌', text: 'Pin important notes to the top' },
      ]}
    />
  );
}
