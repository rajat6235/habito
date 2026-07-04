'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard, CheckSquare, Shield, BookOpen, StickyNote,
  Dumbbell, Target, Calendar, BarChart2, Heart, Trophy,
  Settings, Plus, Search,
} from 'lucide-react';
import { useUiStore } from '@/stores/ui.store';
import { useSearchStore } from '@/stores/search.store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommandItem {
  id:       string;
  label:    string;
  keywords?: string[];
  icon:     React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group:    string;
}

export function CommandPalette() {
  const isOpen              = useUiStore((s) => s.commandPaletteOpen);
  const closeCommandPalette = useUiStore((s) => s.closeCommandPalette);
  const { query, setQuery, addRecentSearch } = useSearchStore();
  const router = useRouter();

  const nav = useCallback((path: string) => {
    closeCommandPalette();
    router.push(path);
  }, [closeCommandPalette, router]);

  const NAV_ITEMS: CommandItem[] = [
    { id: 'dashboard',    group: 'Navigate', label: 'Dashboard',    icon: <LayoutDashboard />, onSelect: () => nav('/app') },
    { id: 'habits',       group: 'Navigate', label: 'Habits',       icon: <CheckSquare />,     onSelect: () => nav('/app/habits') },
    { id: 'recovery',     group: 'Navigate', label: 'Recovery',     icon: <Shield />,          onSelect: () => nav('/app/recovery') },
    { id: 'journal',      group: 'Navigate', label: 'Journal',      icon: <BookOpen />,        onSelect: () => nav('/app/journal') },
    { id: 'notes',        group: 'Navigate', label: 'Notes',        icon: <StickyNote />,      onSelect: () => nav('/app/notes') },
    { id: 'gym',          group: 'Navigate', label: 'Gym',          icon: <Dumbbell />,        onSelect: () => nav('/app/gym') },
    { id: 'goals',        group: 'Navigate', label: 'Goals',        icon: <Target />,          onSelect: () => nav('/app/goals') },
    { id: 'planner',      group: 'Navigate', label: 'Planner',      icon: <Calendar />,        onSelect: () => nav('/app/planner') },
    { id: 'analytics',    group: 'Navigate', label: 'Analytics',    icon: <BarChart2 />,       onSelect: () => nav('/app/analytics') },
    { id: 'life-balance', group: 'Navigate', label: 'Life Balance', icon: <Heart />,           onSelect: () => nav('/app/life-balance') },
    { id: 'achievements', group: 'Navigate', label: 'Achievements', icon: <Trophy />,          onSelect: () => nav('/app/achievements') },
    { id: 'settings',     group: 'Navigate', label: 'Settings',     icon: <Settings />,        onSelect: () => nav('/app/settings') },
  ];

  const QUICK_ACTIONS: CommandItem[] = [
    { id: 'new-habit',   group: 'Quick actions', label: 'New habit',         icon: <Plus />,  onSelect: () => nav('/app/habits?new=1') },
    { id: 'new-note',    group: 'Quick actions', label: 'New note',          icon: <Plus />,  onSelect: () => nav('/app/notes?new=1') },
    { id: 'new-workout', group: 'Quick actions', label: 'Start workout',     icon: <Plus />,  onSelect: () => nav('/app/gym?start=1') },
    { id: 'new-journal', group: 'Quick actions', label: 'Write journal',     icon: <Plus />,  onSelect: () => nav('/app/journal?new=1') },
    { id: 'search',      group: 'Quick actions', label: 'Search everything', icon: <Search />,onSelect: () => nav(`/app/search?q=${encodeURIComponent(query)}`) },
  ];

  const ALL_ITEMS = [...QUICK_ACTIONS, ...NAV_ITEMS];

  function onSelect(item: CommandItem) {
    if (query.trim()) addRecentSearch(query.trim());
    item.onSelect();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCommandPalette()}>
      <DialogContent className="p-0 max-w-xl overflow-hidden" hideClose>
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search or navigate…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="shrink-0 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">Esc</kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </Command.Empty>

            {Object.entries(
              ALL_ITEMS.reduce<Record<string, CommandItem[]>>((acc, item) => {
                if (!acc[item.group]) acc[item.group] = [];
                acc[item.group]!.push(item);
                return acc;
              }, {}),
            ).map(([group, items]) => (
              <Command.Group key={group} heading={group}>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
                    onSelect={() => onSelect(item)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      '[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-muted-foreground',
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {item.shortcut && (
                      <kbd className="ml-auto text-xs text-muted-foreground">{item.shortcut}</kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
