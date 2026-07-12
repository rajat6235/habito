import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitCard } from '../components/shared/HabitCard';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

// framer-motion animations resolve synchronously in tests
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    div: ({ children, layout, initial, animate, transition, whileHover, whileTap, ...p }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) =>
      <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function baseHabit(overrides: Partial<HabitWithTodayLog> = {}): Habit {
  return {
    id:               'h1',
    userId:           'u1',
    title:            'Morning Run',
    description:      'A quick run',
    icon:             '🏃',
    color:            '#10b981',
    frequencyType:    'daily',
    frequencyConfig:  { type: 'daily' },
    priority:         'medium',
    isArchived:       false,
    currentStreak:    3,
    longestStreak:    10,
    totalCompletions: 20,
    lastCompletedDate: null,
    startDate:        '2026-01-01',
    categoryId:       null,
    createdAt:        '2026-01-01T00:00:00.000Z',
    todayLog:         null,
    ...overrides,
  } as unknown as Habit;
}

function multiHabit(timesPerDay: number, completionCount = 0): Habit {
  return baseHabit({
    frequencyConfig: { type: 'custom_daily', timesPerDay },
    todayLog: completionCount > 0 ? {
      id:              'log-1',
      habitId:         'h1',
      logDate:         '2026-07-11',
      status:          'completed',
      completionCount,
      value:           null,
      note:            null,
      skipReason:      null,
      loggedAt:        '2026-07-11T12:00:00.000Z',
    } : null,
  } as Partial<HabitWithTodayLog>);
}

// ── Single-completion habit ───────────────────────────────────────────────────

describe('HabitCard — single-completion', () => {
  it('renders the habit title', () => {
    render(<HabitCard habit={baseHabit()} />);
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<HabitCard habit={baseHabit()} />);
    expect(screen.getByText('🏃')).toBeInTheDocument();
  });

  it('renders the streak', () => {
    render(<HabitCard habit={baseHabit()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows "Mark complete" button when not completed', () => {
    render(<HabitCard habit={baseHabit()} completed={false} />);
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeInTheDocument();
  });

  it('shows "Mark incomplete" button when completed', () => {
    render(<HabitCard habit={baseHabit()} completed={true} />);
    expect(screen.getByRole('button', { name: 'Mark incomplete' })).toBeInTheDocument();
  });

  it('calls onCheck with (habit, true) when toggling incomplete → complete', () => {
    const onCheck = vi.fn();
    render(<HabitCard habit={baseHabit()} completed={false} onCheck={onCheck} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(onCheck).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1' }), true);
  });

  it('calls onCheck with (habit, false) when toggling complete → incomplete', () => {
    const onCheck = vi.fn();
    render(<HabitCard habit={baseHabit()} completed={true} onCheck={onCheck} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark incomplete' }));
    expect(onCheck).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1' }), false);
  });

  it('does NOT call onLog when clicking single-habit check button', () => {
    const onLog   = vi.fn();
    const onCheck = vi.fn();
    render(<HabitCard habit={baseHabit()} completed={false} onCheck={onCheck} onLog={onLog} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(onLog).not.toHaveBeenCalled();
    expect(onCheck).toHaveBeenCalled();
  });

  it('does not call onCheck when loading', () => {
    const onCheck = vi.fn();
    render(<HabitCard habit={baseHabit()} completed={false} onCheck={onCheck} loading={true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('hides description when completed', () => {
    render(<HabitCard habit={baseHabit()} completed={true} />);
    expect(screen.queryByText('A quick run')).not.toBeInTheDocument();
  });

  it('shows description when not completed', () => {
    render(<HabitCard habit={baseHabit()} completed={false} />);
    expect(screen.getByText('A quick run')).toBeInTheDocument();
  });
});

// ── Multi-completion habit ────────────────────────────────────────────────────

describe('HabitCard — multi-completion', () => {
  it('shows count ring with 0/3 when no completions', () => {
    render(<HabitCard habit={multiHabit(3, 0)} />);
    expect(screen.getByRole('button', { name: 'Log Morning Run (0/3)' })).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('shows count ring with 1/3 when partially complete', () => {
    render(<HabitCard habit={multiHabit(3, 1)} />);
    expect(screen.getByRole('button', { name: 'Log Morning Run (1/3)' })).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('calls onLog (not onCheck) when clicking the ring button', () => {
    const onLog   = vi.fn();
    const onCheck = vi.fn();
    render(<HabitCard habit={multiHabit(3, 0)} onLog={onLog} onCheck={onCheck} />);
    fireEvent.click(screen.getByRole('button', { name: 'Log Morning Run (0/3)' }));
    expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1' }));
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('disables ring button when fully done', () => {
    render(<HabitCard habit={multiHabit(3, 3)} onLog={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Log Morning Run (3/3)' });
    expect(btn).toBeDisabled();
  });

  it('ring has aria-pressed=true when fully done', () => {
    render(<HabitCard habit={multiHabit(2, 2)} onLog={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Log Morning Run (2/2)' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows "X more to go" text when partially done', () => {
    render(<HabitCard habit={multiHabit(3, 1)} />);
    expect(screen.getByText('2 more to go')).toBeInTheDocument();
  });
});

// ── History / menu actions ────────────────────────────────────────────────────

describe('HabitCard — history & menu', () => {
  it('renders history button when onHistory is provided', () => {
    render(<HabitCard habit={baseHabit()} onHistory={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'View history' })).toBeInTheDocument();
  });

  it('calls onHistory when history button is clicked', () => {
    const onHistory = vi.fn();
    render(<HabitCard habit={baseHabit()} onHistory={onHistory} />);
    fireEvent.click(screen.getByRole('button', { name: 'View history' }));
    expect(onHistory).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1' }));
  });

  it('does not render context menu trigger when no menu callbacks', () => {
    render(<HabitCard habit={baseHabit()} />);
    expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
  });

  it('renders context menu trigger when onDelete is provided', () => {
    render(<HabitCard habit={baseHabit()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });
});
