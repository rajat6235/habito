'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Is Habito free to use?',
    a: 'Yes! Our free tier includes up to 5 habits, basic journaling, and goal tracking. Upgrade to Pro for unlimited features.',
  },
  {
    q: 'Can I track recovery from addiction?',
    a: 'Absolutely. Habito has a dedicated recovery module with daily check-ins, sobriety streak tracking, and milestone celebrations — all private and secure.',
  },
  {
    q: 'Is my data private?',
    a: 'Your data is encrypted and never sold. Recovery entries are especially protected with additional security layers.',
  },
  {
    q: 'Does Habito work offline?',
    a: 'Yes! Habito is a Progressive Web App (PWA) that works offline. Data syncs automatically when you reconnect.',
  },
  {
    q: 'Can I import data from other apps?',
    a: 'We support importing from popular habit apps. Contact support for specific format assistance.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Habito is a PWA — install it from your browser on iOS or Android for a native app experience with no app store needed.',
  },
  {
    q: 'How does the XP and leveling system work?',
    a: 'You earn XP for completing habits, journaling, logging workouts, and reaching milestones. Level up to unlock badges and achievements.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel anytime with no fees. Your data remains accessible on the free tier.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
            Got questions?
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Frequently asked{' '}
            <span className="gradient-text">questions</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about Habito. Can&apos;t find the answer?{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Chat with us.
            </a>
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
