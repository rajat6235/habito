'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing',  href: '#pricing'  },
  { label: 'FAQ',      href: '#faq'      },
];

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const { resolvedTheme, setTheme }  = useTheme();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/95 border-b border-border shadow-sm backdrop-blur-md'
          : 'bg-background/70 border-b border-border/40 backdrop-blur-xl',
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 select-none">
          <span className="text-primary text-lg">✦</span>
          <span className="text-xl font-bold gradient-text tracking-tight">habito</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity px-4 py-2 rounded-lg"
          >
            Get started
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown — CSS transition, no Framer Motion */}
      <div
        className={cn(
          'md:hidden overflow-hidden border-t border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-200',
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 pt-2 border-t border-border/40 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity px-4 py-2.5 rounded-lg"
            >
              Get started
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
