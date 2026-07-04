import * as React from 'react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: string;
  text: string;
}

interface ModulePreviewProps {
  icon:        React.ReactNode;
  iconColor?:  string;
  title:       string;
  description: string;
  features:    Feature[];
  accentClass?: string;
  className?:  string;
}

export function ModulePreview({
  icon, iconColor, title, description, features, accentClass, className,
}: ModulePreviewProps) {
  return (
    <div className={cn('p-4 md:p-6 lg:p-8 max-w-2xl mx-auto', className)}>
      <div className="flex flex-col items-start gap-6 py-8 md:py-12">
        {/* Module icon */}
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl',
            '[&_svg]:h-8 [&_svg]:w-8',
            iconColor ?? 'bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground border border-border">
              Coming soon
            </span>
          </div>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
            {description}
          </p>
        </div>

        {/* Features */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
            >
              <span className="text-xl leading-none mt-0.5 shrink-0">{f.icon}</span>
              <span className="text-sm text-muted-foreground leading-relaxed">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground">
          This module will be fully implemented in an upcoming release.
          Your data and preferences are safely stored.
        </p>
      </div>
    </div>
  );
}
