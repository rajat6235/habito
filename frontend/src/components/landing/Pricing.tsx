'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  name:      string;
  badge?:    string;
  monthlyPrice: number;
  annualPrice:  number;
  tagline:   string;
  features:  string[];
  cta:       string;
  ctaHref:   string;
  highlight: boolean;
}

const plans: Plan[] = [
  {
    name:         'Free',
    monthlyPrice: 0,
    annualPrice:  0,
    tagline:      'Perfect to start',
    features: [
      'Up to 5 habits',
      'Basic journaling',
      'Goal tracking',
      'Mobile app',
    ],
    cta:       'Get started free',
    ctaHref:   '/register',
    highlight: false,
  },
  {
    name:         'Pro',
    badge:        'Most Popular',
    monthlyPrice: 9,
    annualPrice:  7,
    tagline:      'Most Popular',
    features: [
      'Unlimited habits',
      'Advanced analytics',
      'Recovery tracking',
      'Gym logging',
      'AI insights',
      'Priority support',
    ],
    cta:       'Start Pro trial',
    ctaHref:   '/register',
    highlight: true,
  },
  {
    name:         'Team',
    monthlyPrice: 29,
    annualPrice:  23,
    tagline:      'For teams',
    features: [
      'Everything in Pro',
      'Up to 10 members',
      'Team challenges',
      'Admin dashboard',
      'SSO',
      'Dedicated support',
    ],
    cta:       'Contact sales',
    ctaHref:   '#',
    highlight: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
            Simple pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Start free.{' '}
            <span className="gradient-text">Grow as you need.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            No hidden fees. No surprise charges. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'text-sm font-medium transition-colors px-3 py-1.5 rounded-lg',
                !annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'text-sm font-medium transition-colors px-3 py-1.5 rounded-lg flex items-center gap-2',
                annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Annual
              <span className="text-xs bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded-full font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-2xl bg-card p-8 flex flex-col gap-6',
                  plan.highlight
                    ? 'gradient-border shadow-xl shadow-brand-500/10 md:-translate-y-2'
                    : 'border border-border',
                )}
              >
                {/* Most Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-brand-500 to-brand-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan info */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {plan.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${plan.name}-${annual}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="text-5xl font-extrabold text-foreground"
                    >
                      ${price}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-muted-foreground text-sm mb-2">/month</span>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className={cn(
                    'block text-center text-sm font-semibold py-3 rounded-xl transition-all',
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
                      : 'border border-border text-foreground hover:bg-muted',
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
