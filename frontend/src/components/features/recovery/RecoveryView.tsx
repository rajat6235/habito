'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Clock, AlertTriangle, ChevronRight, Play, Pause, MoreHorizontal } from 'lucide-react';
import { useRecoveryGoals, useCreateRecoveryGoal, useLogRelapse, usePauseResumeGoal, useSobrietyClock } from '@/hooks/api/useRecovery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { RecoveryGoal } from '@/lib/api/recovery.api';

// ── Sobriety Clock ────────────────────────────────────────────────────────────

function SobrietyDisplay({ goalId, color }: { goalId: string; color?: string | null }) {
  const { data: clock } = useSobrietyClock(goalId);
  if (!clock) return <div className="h-8 w-24 animate-pulse bg-muted rounded" />;
  const { days, hours, minutes } = clock;
  return (
    <div className="flex items-baseline gap-1.5 tabular-nums">
      {days > 0 && (
        <span className="text-3xl font-bold" style={{ color: color ?? undefined }}>
          {days}<span className="text-base font-normal text-muted-foreground ml-0.5">d</span>
        </span>
      )}
      <span className="text-xl font-semibold text-muted-foreground">
        {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m
      </span>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, onRelapseClick }: { goal: RecoveryGoal; onRelapseClick: (g: RecoveryGoal) => void }) {
  const pause = usePauseResumeGoal(goal.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: goal.color ? `${goal.color}20` : undefined }}
          >
            {goal.icon ?? '🛡️'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{goal.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                goal.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                goal.status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-muted text-muted-foreground',
              )}>
                {goal.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {goal.totalRelapses} {goal.totalRelapses === 1 ? 'relapse' : 'relapses'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => pause.mutate(goal.status === 'active')}
            loading={pause.isPending}
            aria-label={goal.status === 'active' ? 'Pause goal' : 'Resume goal'}
          >
            {goal.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <SobrietyDisplay goalId={goal.id} color={goal.color} />

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-2xl font-bold tabular-nums">{goal.currentStreakDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Current streak (days)</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-2xl font-bold tabular-nums">{goal.longestStreakDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Best streak (days)</p>
        </div>
      </div>

      {goal.status === 'active' && (
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => onRelapseClick(goal)}
        >
          <AlertTriangle className="h-4 w-4" />
          Log a relapse
        </Button>
      )}
    </motion.div>
  );
}

// ── Log Relapse Sheet ──────────────────────────────────────────────────────────

function RelapseModal({ goal, onClose }: { goal: RecoveryGoal; onClose: () => void }) {
  const logRelapse = useLogRelapse(goal.id);
  const [triggers, setTriggers] = useState('');
  const [notes,    setNotes]    = useState('');
  const [plan,     setPlan]     = useState('');

  async function handleSubmit() {
    await logRelapse.mutateAsync({
      triggers: triggers.split(',').map((t) => t.trim()).filter(Boolean),
      notes:    notes || undefined,
      planForNext: plan || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full sm:max-w-md rounded-2xl bg-card border border-border p-6 space-y-5 shadow-2xl"
      >
        <div className="space-y-1">
          <h3 className="font-bold text-lg">Log relapse</h3>
          <p className="text-sm text-muted-foreground">
            You're being brave by acknowledging this. Let's learn from it.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>What triggered it?</Label>
            <Input
              placeholder="e.g. stress, boredom, social situation"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate multiple triggers with commas</p>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="What were you feeling? What happened?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plan for next time (optional)</Label>
            <Textarea
              placeholder="Next time I'll…"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleSubmit}
            loading={logRelapse.isPending}
          >
            Log relapse
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Create Goal Sheet ────────────────────────────────────────────────────────

const PRESETS = [
  { key: 'no_smoking',      label: 'No Smoking',      emoji: '🚭' },
  { key: 'no_alcohol',      label: 'No Alcohol',      emoji: '🍺' },
  { key: 'no_social_media', label: 'No Social Media', emoji: '📱' },
  { key: 'no_sugar',        label: 'No Sugar',        emoji: '🍬' },
  { key: 'no_gambling',     label: 'No Gambling',     emoji: '🎰' },
  { key: 'no_junk_food',    label: 'No Junk Food',    emoji: '🍔' },
  { key: 'no_caffeine',     label: 'No Caffeine',     emoji: '☕' },
  { key: 'custom',          label: 'Custom',           emoji: '✨' },
];

function CreateGoalSheet({ onClose }: { onClose: () => void }) {
  const createGoal = useCreateRecoveryGoal();
  const [preset,     setPreset]     = useState('');
  const [customName, setCustomName] = useState('');

  async function handleCreate() {
    const chosen = PRESETS.find((p) => p.key === preset);
    const name   = preset === 'custom' ? customName : (chosen?.label ?? customName);
    if (!name.trim()) return;

    await createGoal.mutateAsync({
      name,
      presetType: preset && preset !== 'custom' ? preset : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full sm:max-w-md rounded-2xl bg-card border border-border p-6 space-y-5 shadow-2xl"
      >
        <div>
          <h3 className="font-bold text-lg">New recovery goal</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Choose a preset or create your own.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all',
                preset === p.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <span className="text-lg">{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="space-y-1.5">
            <Label>Goal name</Label>
            <Input
              placeholder="e.g. No video games"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            disabled={!preset || (preset === 'custom' && !customName.trim())}
            loading={createGoal.isPending}
          >
            Start tracking
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};

export function RecoveryView() {
  const { data: goals = [], isLoading } = useRecoveryGoals();
  const [showCreate,      setShowCreate]      = useState(false);
  const [relapsingGoal,   setRelapsingGoal]   = useState<RecoveryGoal | null>(null);

  return (
    <>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 pb-28 md:pb-10"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Recovery
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Your journey</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {goals.length > 0 && goals.some((g) => g.status === 'active')
                ? 'Every moment sober is a victory.'
                : 'Start tracking your sobriety streak.'}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        </motion.div>

        {/* Goals */}
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : goals.length === 0 ? (
          <motion.div variants={fadeUp}>
            <EmptyState
              icon={<Shield />}
              title="No recovery goals yet"
              description="Start tracking your sobriety journey. Every moment sober is a victory."
              action={{ label: 'Add first goal', onClick: () => setShowCreate(true), icon: <Plus /> }}
              className="py-16 rounded-2xl border border-border bg-muted/20"
            />
          </motion.div>
        ) : (
          <motion.div variants={stagger} className="space-y-4">
            <AnimatePresence>
              {goals.map((goal) => (
                <motion.div key={goal.id} variants={fadeUp}>
                  <GoalCard goal={goal} onRelapseClick={setRelapsingGoal} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <CreateGoalSheet onClose={() => setShowCreate(false)} />}
        {relapsingGoal && (
          <RelapseModal goal={relapsingGoal} onClose={() => setRelapsingGoal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
