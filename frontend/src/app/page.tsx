import type { Metadata } from 'next';
import { Navbar }       from '@/components/landing/Navbar';
import { Hero }         from '@/components/landing/Hero';
import { Features }     from '@/components/landing/Features';
import { HowItWorks }   from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing }      from '@/components/landing/Pricing';
import { FAQ }          from '@/components/landing/FAQ';
import { Footer }       from '@/components/landing/Footer';

export const metadata: Metadata = {
  title:       'Habito — Your Personal Operating System',
  description: 'Build habits, track recovery, log workouts, journal daily, and achieve your goals with Habito.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
