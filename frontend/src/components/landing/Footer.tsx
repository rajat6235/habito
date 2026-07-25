import Link from 'next/link';
import { Github, Twitter, Globe } from 'lucide-react';

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'Features',  href: '/#features' },
      { label: 'Pricing',   href: '/#pricing'  },
      { label: 'Changelog', href: null         },
      { label: 'Roadmap',   href: null         },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',   href: null },
      { label: 'Blog',    href: null },
      { label: 'Careers', href: null },
      { label: 'Press',   href: null },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy',  href: '/privacy' },
      { label: 'Terms',    href: '/terms'   },
      { label: 'Cookies',  href: null       },
      { label: 'Security', href: null       },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: null },
      { label: 'Discord',     href: null },
      { label: 'Status',      href: null },
      { label: 'Contact',     href: 'mailto:support@habito.app' },
    ],
  },
];

const socials = [
  { icon: Twitter, label: 'Twitter' },
  { icon: Github,  label: 'GitHub'  },
  { icon: Globe,   label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-primary">✦</span>
              <span className="text-lg font-bold gradient-text tracking-tight">habito</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your personal operating system for a better life.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">{col.heading}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground/40 cursor-default select-none">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Habito. All rights reserved.
          </p>

          <div className="flex items-center gap-1">
            {socials.map(({ icon: Icon, label }) => (
              <span
                key={label}
                aria-label={`${label} — coming soon`}
                title={`${label} — coming soon`}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground/30 cursor-default"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
