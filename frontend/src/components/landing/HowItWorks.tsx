const steps = [
  {
    number: '01',
    title:  'Create your profile',
    desc:   'Set your goals, choose your habits, and tell Habito what matters most to you. Setup takes under two minutes.',
  },
  {
    number: '02',
    title:  'Track daily',
    desc:   'Log habit completions, write journal entries, record workouts, and check in on your recovery — all in one place.',
  },
  {
    number: '03',
    title:  'See results',
    desc:   'Rich analytics surface your streaks, XP gains, mood patterns, and life-balance score so you can keep improving.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
            Simple by design
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Up and running{' '}
            <span className="gradient-text">in minutes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No complicated onboarding. No learning curve. Just open Habito and start building a better you.
          </p>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row gap-8">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden
            className="hidden md:block absolute top-10 left-[calc(16.666%-1px)] right-[calc(16.666%-1px)] h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
          />

          {steps.map((step) => (
            <div
              key={step.number}
              className="flex-1 flex flex-col items-center text-center gap-4"
            >
              {/* Number circle */}
              <div className="relative z-10 h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
                <span className="text-2xl font-extrabold text-white">{step.number}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
