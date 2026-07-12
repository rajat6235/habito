'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  percentage:   number;
  completed:    number;
  total:        number;
  streak?:      number;
  size?:        number;
  strokeWidth?: number;
  className?:   string;
}

export function ProgressRing({
  percentage,
  completed,
  total,
  streak      = 0,
  size        = 140,
  strokeWidth = 10,
  className,
}: ProgressRingProps) {
  const radius       = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference - (percentage / 100) * circumference;
  const allDone      = total > 0 && completed === total;
  const center       = size / 2;
  const filterId     = `ring-glow-${size}`;

  const fillColor = allDone ? '#10b981' : 'hsl(243 75% 59%)';

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.25, 0.4, 0.25, 1], delay: 0.08 }}
          filter={`url(#${filterId})`}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        {allDone ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 500, damping: 25 }}
            className="text-3xl leading-none"
            aria-label="All done"
          >
            🎉
          </motion.div>
        ) : (
          <>
            <motion.span
              key={percentage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-black tabular-nums leading-none"
              style={{ color: fillColor }}
            >
              {percentage}%
            </motion.span>
            <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
              {completed}/{total}
            </span>
          </>
        )}
        {streak > 0 && (
          <div className="flex items-center gap-0.5 mt-1.5">
            <span className="text-[10px] leading-none" aria-hidden>🔥</span>
            <span className="text-[10px] font-bold text-amber-500 tabular-nums">{streak}</span>
          </div>
        )}
      </div>
    </div>
  );
}
