import {
  CheckSquare,
  Shield,
  Dumbbell,
  BookOpen,
  Target,
  BarChart2,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon:  LucideIcon;
  color: string;
  bg:    string;
  title: string;
  desc:  string;
}

const features: Feature[] = [
  {
    icon:  CheckSquare,
    color: 'text-brand-500',
    bg:    'bg-brand-500/10',
    title: 'Habit Tracking',
    desc:  'Build streaks that last. Track daily, weekly, and custom-frequency habits with beautiful progress visualization.',
  },
  {
    icon:  Shield,
    color: 'text-emerald-500',
    bg:    'bg-emerald-500/10',
    title: 'Recovery Support',
    desc:  'Every day matters. Track sobriety milestones, log check-ins, and celebrate your strength with recovery analytics.',
  },
  {
    icon:  Dumbbell,
    color: 'text-amber-500',
    bg:    'bg-amber-500/10',
    title: 'Gym Logging',
    desc:  'Log workouts, track PRs, and visualize strength gains over time. Your fitness journey, beautifully recorded.',
  },
  {
    icon:  BookOpen,
    color: 'text-violet-500',
    bg:    'bg-violet-500/10',
    title: 'Daily Journal',
    desc:  'Morning intentions, evening reflections, mood tracking. Build self-awareness with structured journaling.',
  },
  {
    icon:  Target,
    color: 'text-rose-500',
    bg:    'bg-rose-500/10',
    title: 'Goal Setting',
    desc:  'Break big dreams into achievable milestones. Track progress, celebrate wins, and stay accountable.',
  },
  {
    icon:  BarChart2,
    color: 'text-cyan-500',
    bg:    'bg-cyan-500/10',
    title: 'Life Analytics',
    desc:  'Beautiful dashboards showing your habits, streaks, XP, and life balance scores in one place.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            One app.{' '}
            <span className="gradient-text">Infinite growth.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Habito brings every aspect of personal development under one roof — beautifully designed and deeply integrated.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group gradient-border-hover rounded-2xl bg-card p-6 flex flex-col gap-4 cursor-default transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                {/* Icon container */}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${f.bg}`}>
                  <Icon className={`h-6 w-6 ${f.color}`} />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <h3 className="font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>

                {/* Footer link */}
                <span className="text-sm text-primary font-medium">
                  Learn more →
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
