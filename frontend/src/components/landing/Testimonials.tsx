import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah K.',
    role: 'Product Manager',
    text: 'Habito completely changed how I approach my mornings. My meditation streak is at 90 days!',
  },
  {
    name: 'Marcus T.',
    role: 'Software Engineer',
    text: 'The recovery tracking feature is incredible. Having everything in one place makes accountability so much easier.',
  },
  {
    name: 'Priya M.',
    role: 'Fitness Coach',
    text: 'My clients love the gym logging. The PR tracking keeps everyone motivated and competing with their past selves.',
  },
  {
    name: 'James L.',
    role: 'Entrepreneur',
    text: "I've tried every habit app. Habito is the first one that actually sticks because it covers everything — habits, goals, and journaling.",
  },
  {
    name: 'Elena R.',
    role: 'Therapist',
    text: 'The journaling templates are thoughtfully designed. I recommend Habito to my clients for daily reflection.',
  },
  {
    name: 'David W.',
    role: 'Student',
    text: 'Went from failing half my habits to 85% completion rate in 3 months. The streak visualization is addictive!',
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase();
}

const gradients = [
  'from-brand-500 to-brand-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-cyan-500 to-cyan-700',
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
            Loved by thousands
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Real people,{' '}
            <span className="gradient-text">real results</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join thousands of people who have transformed their lives with Habito.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div
                  className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shrink-0`}
                >
                  <span className="text-xs font-bold text-white">{getInitials(t.name)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
