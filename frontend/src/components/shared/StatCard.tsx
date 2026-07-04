import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label:      string;
  value:      string | number;
  unit?:      string;
  change?:    number;
  trend?:     'up' | 'down' | 'neutral';
  icon?:      React.ReactNode;
  iconColor?: string;
  loading?:   boolean;
  className?: string;
  onClick?:   () => void;
}

export function StatCard({
  label, value, unit, change, trend = 'neutral', icon, iconColor, loading, className, onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      </Card>
    );
  }

  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'   ? 'text-emerald-600 dark:text-emerald-400' :
    trend === 'down' ? 'text-destructive' :
    'text-muted-foreground';

  return (
    <Card
      className={cn(
        'p-5 transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums tracking-tight">{value}</span>
            {unit && (
              <span className="text-sm text-muted-foreground font-normal">{unit}</span>
            )}
          </div>
          {(change !== undefined || trend !== 'neutral') && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3 shrink-0" />
              {change !== undefined && (
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
              )}
              <span className="text-muted-foreground font-normal">vs last week</span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              '[&_svg]:h-5 [&_svg]:w-5',
              iconColor ?? 'bg-primary/10 text-primary',
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
