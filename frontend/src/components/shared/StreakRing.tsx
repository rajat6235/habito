'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreakRingProps {
  streak:      number;
  target?:     number;        // days for a full ring (default 30)
  size?:       'sm' | 'md' | 'lg';
  color?:      string;        // CSS color for the ring stroke
  className?:  string;
  showLabel?:  boolean;
}

const SIZES = {
  sm: { r: 18, sw: 3, font: 'text-[10px]', outer: 44 },
  md: { r: 28, sw: 4, font: 'text-sm',     outer: 68 },
  lg: { r: 40, sw: 5, font: 'text-lg',     outer: 96 },
};

export function StreakRing({
  streak, target = 30, size = 'md', color, className, showLabel = true,
}: StreakRingProps) {
  const { r, sw, font, outer } = SIZES[size];
  const cx = outer / 2;
  const cy = outer / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(streak / target, 1);
  const dashOffset = circumference * (1 - progress);

  const strokeColor = color ?? 'hsl(var(--primary))';
  const isMaxed = progress >= 1;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={outer} height={outer} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={sw}
        />
        {/* Progress */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {/* Glow when maxed */}
        {isMaxed && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={sw + 2}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            opacity={0.25}
            strokeLinecap="round"
          />
        )}
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums leading-none', font)}>{streak}</span>
          <span className="text-[8px] text-muted-foreground leading-none mt-0.5">days</span>
        </div>
      )}
    </div>
  );
}
