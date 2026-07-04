export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const features = [
    {
      icon:  '✅',
      label: 'Habit Tracking',
      desc:  'Build streaks, crush goals, celebrate wins',
    },
    {
      icon:  '🛡️',
      label: 'Recovery Support',
      desc:  'Every day sober counts — we track it all',
    },
    {
      icon:  '💪',
      label: 'Gym Logging',
      desc:  'Log PRs, track volume, see progress curves',
    },
    {
      icon:  '📓',
      label: 'Daily Journal',
      desc:  'Morning reflections, evening gratitude',
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">habito</span>
            <p className="text-brand-200 mt-1.5 text-sm font-medium">
              Your Personal Operating System
            </p>
          </div>

          {/* Hero copy */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white leading-snug tracking-tight">
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
              {features.map((f) => (
                <div key={f.label} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0 border border-white/10">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-none mb-1">{f.label}</p>
                    <p className="text-brand-300 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-brand-400 text-xs">
            &copy; {new Date().getFullYear()} Habito · Built with purpose
          </p>
        </div>
      </div>

      {/* ── Right form area ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="text-2xl font-bold gradient-text">habito</span>
            <p className="text-muted-foreground text-xs mt-1">Your Personal Operating System</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
