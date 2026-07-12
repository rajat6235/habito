'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Moon, PenLine, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { useJournalByDate, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from '@/hooks/api/useJournal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/lib/api/journal.api';

// ── Mood Slider ───────────────────────────────────────────────────────────────

function MoodPicker({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  const EMOJIS = ['😞', '😕', '😐', '🙂', '😊', '😄', '🥰', '🤩', '💪', '🚀'];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={cn(
              'h-9 w-9 text-lg rounded-lg border transition-all',
              value === i + 1
                ? 'border-primary bg-primary/10 scale-110'
                : 'border-border hover:border-primary/50',
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Gratitude / Wins list ─────────────────────────────────────────────────────

function ListField({ label, items, onChange, placeholder }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  function update(idx: number, val: string) {
    const next = [...items];
    next[idx] = val;
    onChange(next.filter((_, i) => i !== next.length - 1 || val !== ''));
  }

  const display = [...items, ''];

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="space-y-1.5">
        {display.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm w-4 shrink-0">{idx + 1}.</span>
            <input
              value={item}
              onChange={(e) => update(idx, e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none text-sm py-1 placeholder:text-muted-foreground/50 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Entry Type Tab ────────────────────────────────────────────────────────────

type EntryType = 'morning' | 'evening' | 'free_write';

const TABS: { key: EntryType; label: string; icon: React.ReactNode }[] = [
  { key: 'morning',    label: 'Morning',   icon: <Sun className="h-4 w-4" /> },
  { key: 'evening',   label: 'Evening',   icon: <Moon className="h-4 w-4" /> },
  { key: 'free_write',label: 'Free Write', icon: <PenLine className="h-4 w-4" /> },
];

// ── Morning Form ──────────────────────────────────────────────────────────────

function MorningForm({ entry, date, onSaved }: { entry?: JournalEntry; date: string; onSaved: () => void }) {
  const create = useCreateJournalEntry();
  const update = useUpdateJournalEntry(entry?.id ?? '');

  const [mood,      setMood]      = useState(entry?.moodMorning ?? null);
  const [energy,    setEnergy]    = useState(entry?.energyLevel ?? null);
  const [sleep,     setSleep]     = useState(entry?.sleepQuality ?? null);
  const [gratitude, setGratitude] = useState<string[]>(entry?.gratitude ?? []);
  const [intention, setIntention] = useState(entry?.intention ?? '');
  const [content,   setContent]   = useState(entry?.content ?? '');

  const saving = create.isPending || update.isPending;

  async function handleSave() {
    const payload = {
      entryDate: date,
      entryType: 'morning' as const,
      moodMorning: mood ?? undefined,
      energyLevel: energy ?? undefined,
      sleepQuality: sleep ?? undefined,
      gratitude: gratitude.filter(Boolean),
      intention: intention || undefined,
      content: content || undefined,
    };
    if (entry) await update.mutateAsync(payload);
    else       await create.mutateAsync(payload);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <MoodPicker label="How are you feeling? 🌅" value={mood} onChange={setMood} />
      <MoodPicker label="Energy level ⚡" value={energy} onChange={setEnergy} />
      <MoodPicker label="Sleep quality 💤" value={sleep} onChange={setSleep} />
      <ListField
        label="Gratitude (3 things you're grateful for)"
        items={gratitude}
        onChange={setGratitude}
        placeholder="I'm grateful for…"
      />
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Today's intention</label>
        <Textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="Today I intend to…"
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Free thoughts</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Anything on your mind…"
          rows={4}
        />
      </div>
      <Button onClick={handleSave} loading={saving} className="w-full">
        <Save className="h-4 w-4" />
        {entry ? 'Update entry' : 'Save morning entry'}
      </Button>
    </div>
  );
}

// ── Evening Form ──────────────────────────────────────────────────────────────

function EveningForm({ entry, date, onSaved }: { entry?: JournalEntry; date: string; onSaved: () => void }) {
  const create = useCreateJournalEntry();
  const update = useUpdateJournalEntry(entry?.id ?? '');

  const [mood,    setMood]    = useState(entry?.moodEvening ?? null);
  const [rating,  setRating]  = useState(entry?.dayRating ?? null);
  const [stress,  setStress]  = useState(entry?.stressLevel ?? null);
  const [wins,    setWins]    = useState<string[]>(entry?.wins ?? []);
  const [lessons, setLessons] = useState(entry?.lessons ?? '');
  const [content, setContent] = useState(entry?.content ?? '');

  const saving = create.isPending || update.isPending;

  async function handleSave() {
    const payload = {
      entryDate: date,
      entryType: 'evening' as const,
      moodEvening: mood ?? undefined,
      dayRating: rating ?? undefined,
      stressLevel: stress ?? undefined,
      wins: wins.filter(Boolean),
      lessons: lessons || undefined,
      content: content || undefined,
    };
    if (entry) await update.mutateAsync(payload);
    else       await create.mutateAsync(payload);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <MoodPicker label="How did you feel today? 🌙" value={mood} onChange={setMood} />
      <div className="space-y-2">
        <p className="text-sm font-medium">Day rating</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                'h-10 w-10 rounded-lg border text-sm font-semibold transition-all',
                rating === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <MoodPicker label="Stress level 😤" value={stress} onChange={setStress} />
      <ListField
        label="Today's wins 🏆"
        items={wins}
        onChange={setWins}
        placeholder="Something that went well…"
      />
      <div className="space-y-1.5">
        <label className="text-sm font-medium">What did you learn today?</label>
        <Textarea
          value={lessons}
          onChange={(e) => setLessons(e.target.value)}
          placeholder="Today I learned that…"
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Reflections</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Any other thoughts about today…"
          rows={4}
        />
      </div>
      <Button onClick={handleSave} loading={saving} className="w-full">
        <Save className="h-4 w-4" />
        {entry ? 'Update entry' : 'Save evening entry'}
      </Button>
    </div>
  );
}

// ── Free Write Form ───────────────────────────────────────────────────────────

function FreeWriteForm({ entry, date, onSaved }: { entry?: JournalEntry; date: string; onSaved: () => void }) {
  const create = useCreateJournalEntry();
  const update = useUpdateJournalEntry(entry?.id ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const saving = create.isPending || update.isPending;

  async function handleSave() {
    const payload = { entryDate: date, entryType: 'free_write' as const, content: content || undefined };
    if (entry) await update.mutateAsync(payload);
    else       await create.mutateAsync(payload);
    onSaved();
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Let your thoughts flow…"
        className="min-h-[300px] resize-none text-base leading-relaxed"
      />
      <Button onClick={handleSave} loading={saving} className="w-full">
        <Save className="h-4 w-4" />
        {entry ? 'Update' : 'Save'}
      </Button>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};

export function JournalView() {
  const [date,        setDate]        = useState(new Date());
  const [activeTab,   setActiveTab]   = useState<EntryType>('morning');
  const [editingId,   setEditingId]   = useState<string | null>(null);

  const dateStr   = format(date, 'yyyy-MM-dd');
  const { data: entries = [], isLoading } = useJournalByDate(date);
  const deleteEntry = useDeleteJournalEntry();

  const currentEntry = entries.find((e) => e.entryType === activeTab);
  const isEditing    = editingId === currentEntry?.id || !currentEntry;

  function prevDay() { setDate((d) => subDays(d, 1)); }
  function nextDay() { setDate((d) => addDays(d, 1)); }
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 pb-28 md:pb-10">
      {/* ── Date navigator ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Journal</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(date, 'EEEE, MMMM d, yyyy')}
              {isToday && ' · Today'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevDay} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} disabled={isToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={nextDay} disabled={isToday} aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {TABS.map((tab) => {
          const has = entries.some((e) => e.entryType === tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setEditingId(null); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.icon}
              {tab.label}
              {has && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Existing entry — view mode */}
            {currentEntry && !isEditing && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentEntry.createdAt), 'h:mm a')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(currentEntry.id)}
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteEntry.mutate(currentEntry.id)}
                      loading={deleteEntry.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {currentEntry.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {currentEntry.content}
                  </p>
                )}
                {currentEntry.gratitude.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gratitude</p>
                    {currentEntry.gratitude.map((g, i) => (
                      <p key={i} className="text-sm text-foreground">{i + 1}. {g}</p>
                    ))}
                  </div>
                )}
                {currentEntry.wins.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wins</p>
                    {currentEntry.wins.map((w, i) => (
                      <p key={i} className="text-sm text-foreground">{i + 1}. {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Write / Edit mode */}
            {isEditing && (
              <div className="rounded-xl border border-border bg-card p-5">
                {activeTab === 'morning'    && <MorningForm    entry={currentEntry} date={dateStr} onSaved={() => setEditingId(null)} />}
                {activeTab === 'evening'    && <EveningForm    entry={currentEntry} date={dateStr} onSaved={() => setEditingId(null)} />}
                {activeTab === 'free_write' && <FreeWriteForm  entry={currentEntry} date={dateStr} onSaved={() => setEditingId(null)} />}
              </div>
            )}

            {/* New entry button — when no entry and not already editing */}
            {!currentEntry && !isEditing && (
              <button
                onClick={() => setEditingId('new')}
                className="w-full flex items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Write {activeTab === 'morning' ? 'morning' : activeTab === 'evening' ? 'evening' : 'free write'} entry
                </span>
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
