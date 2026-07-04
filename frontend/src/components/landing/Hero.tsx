'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ChevronRight, Sparkles } from 'lucide-react';

function fadeUp(delay = 0) {
  return {
    initial:   { opacity: 0, y: 28 },
    animate:   { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  };
}

const stats = [
  { value: '10,000+', label: 'Users'          },
  { value: '2M+',     label: 'Habits Tracked' },
  { value: '98%',     label: 'Satisfaction'   },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background orbs */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: '#6d60f0' }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: '#7c3aed' }}
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[160px] opacity-10 pointer-events-none"
        style={{ background: '#4f46e5' }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        {/* Announcement badge */}
        <motion.div {...fadeUp(0)} className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium select-none">
            <Sparkles className="h-3.5 w-3.5" />
            Now open for early access · Join 10,000+ users
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-foreground mb-6"
        >
          Build the{' '}
          <span className="gradient-text">habits</span>
          <br />
          that build your{' '}
          <span className="gradient-text">life</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.2)}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The all-in-one personal operating system for habit tracking, recovery support,
          gym logging, journaling, and goal achievement.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium px-8 py-4 rounded-xl text-base border border-border hover:bg-muted/50 transition-colors"
          >
            <Play className="h-4 w-4" />
            See how it works
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          {...fadeUp(0.4)}
          className="inline-flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-border border border-border rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-10 py-4">
              <span className="text-2xl font-extrabold gradient-text">{stat.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5 tracking-wide">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
