import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?:        React.ReactNode;
  title:        string;
  description?: string;
  action?:      {
    label:    string;
    onClick:  () => void;
    icon?:    React.ReactNode;
  };
  className?:   string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn('flex flex-col items-center justify-center py-14 px-6 text-center', className)}
    >
      {icon && (
        <div className="mb-5 relative">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center [&_svg]:h-7 [&_svg]:w-7 text-muted-foreground/60">
            {icon}
          </div>
          {/* Soft glow ring */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/50" aria-hidden />
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          leftIcon={action.icon}
          size="sm"
          className="font-semibold"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
