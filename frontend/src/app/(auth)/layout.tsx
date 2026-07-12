import { CheckCircle2, Shield, Dumbbell, BookOpen } from 'lucide-react';

const features = [
  {
    icon:  CheckCircle2,
    color: 'text-brand-400',
    bg:    'bg-brand-500/20',
    label: 'Habit Tracking',
    desc:  'Build streaks, crush goals, celebrate wins',
  },
  {
    icon:  Shield,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/20',
    label: 'Recovery Support',
    desc:  'Every day sober counts — we track it all',
  },
  {
    icon:  Dumbbell,
    color: 'text-amber-400',
    bg:    'bg-amber-500/20',
    label: 'Gym Logging',
    desc:  'Log PRs, track volume, see progress curves',
  },
  {
    icon:  BookOpen,
    color: 'text-violet-400',
    bg:    'bg-violet-500/20',
    label: 'Daily Journal',
    desc:  'Morning reflections, evening gratitude',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-[#1e1456]">
        {/* Animated orbs */}
        <div
          aria-hidden
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-30 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6d60f0 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b82f8 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-brand-300 text-xl">✦</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">habito</span>
            </div>
            <p className="text-brand-300 text-sm font-medium">
              Your Personal Operating System
            </p>
          </div>

          {/* Hero copy */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                Build the life<br />
                you deserve
              </h2>
              <p className="text-brand-200 text-sm leading-relaxed max-w-xs">
                Habito combines habit science, recovery support, and life tracking
                into one beautiful, focused system.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${f.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-none mb-1">{f.label}</p>
                      <p className="text-brand-300 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p className="text-brand-500 text-xs">
            &copy; {new Date().getFullYear()} Habito &middot; Built with purpose
          </p>
        </div>
      </div>

      {/* ── Right form area ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 md:p-10 pt-safe-or-6 pb-safe-or-6 relative"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='1' cy='1' r='1' fill='hsl(220 13%25 91%25)' fill-opacity='0.4'/%3E%3C/svg%3E\")",
          backgroundSize: '32px 32px',
        }}
      >
        {/* Glassmorphism card wrapper */}
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <span className="text-primary">✦</span>
              <span className="text-2xl font-extrabold gradient-text tracking-tight">habito</span>
            </div>
            <p className="text-muted-foreground text-xs">Your Personal Operating System</p>
          </div>

          {/* Card */}
          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
