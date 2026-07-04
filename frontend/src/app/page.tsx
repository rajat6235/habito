import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Habito — Your Personal Operating System',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-extrabold gradient-text mb-4">habito</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-10">
        Your Personal Operating System. Build habits, track recovery, log workouts, journal daily, and achieve your goals.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Get started free
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
