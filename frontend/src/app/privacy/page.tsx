import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy Policy · Habito' };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: July 2026</p>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Your privacy matters to us. This policy explains how Habito collects, uses, and protects your personal information.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Information We Collect</h2>
          <p>
            We collect information you provide directly: account details (name, email, username), wellness data (habits, journal entries, goals, recovery records), and usage information to improve the service.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">How We Use Your Data</h2>
          <p>
            Your data is used solely to provide and improve Habito's features. We do not sell your personal information to third parties.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption in transit and at rest to protect your data.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data at any time by contacting support@habito.app.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8">Contact</h2>
          <p>
            For privacy questions, contact us at support@habito.app.
          </p>
        </div>
      </div>
    </main>
  );
}
