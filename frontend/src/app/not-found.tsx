import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page Not Found · Habito' };

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-extrabold gradient-text mb-4">404</p>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/app"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Open app
        </Link>
      </div>
    </main>
  );
}
