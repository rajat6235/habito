import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms of Service · Habito' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: July 2026</p>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>
            By accessing or using Habito, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Use of Service</h2>
          <p>
            Habito provides personal wellness tracking tools including habit tracking, journaling, goal management, and recovery support. You may use the service only for lawful purposes and in accordance with these terms.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Your Account</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Data & Privacy</h2>
          <p>
            We handle your data in accordance with our{' '}
            <Link href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Contact</h2>
          <p>
            For questions about these terms, contact us at support@habito.app.
          </p>
        </div>
      </div>
    </main>
  );
}
