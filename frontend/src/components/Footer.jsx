// frontend/src/components/Footer.jsx
'use client';

import Link from 'next/link';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative">
      {/* Thin accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent" />

      <div className="bg-[color:var(--color-background-secondary)]/70 supports-[backdrop-filter]:backdrop-blur-xl border-t border-[color:var(--color-background-secondary)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Brand */}
            <Link
              href="/"
              className="inline-flex items-center font-extrabold text-lg sm:text-xl
                         bg-clip-text text-transparent
                         bg-gradient-to-r from-[color:var(--color-accent)] to-[color:var(--color-text-secondary)]"
              aria-label="CineMaster home"
            >
              CineMaster
            </Link>

            {/* Nav */}
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[color:var(--color-text-primary)]"
            >
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/search">Search</FooterLink>
              <FooterLink href="/watchlist">Watchlist</FooterLink>
              <FooterLink href="/login">Login</FooterLink>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-[color:var(--color-text-secondary)]">
              © {year} CineMaster
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

function FooterLink({ href, children }) {
  return (
    <Link
      href={href}
      className="relative transition-colors hover:text-[color:var(--color-accent)]
                 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px]
                 after:w-0 after:bg-[color:var(--color-accent)]
                 after:transition-[width] after:duration-300 hover:after:w-full"
    >
      {children}
    </Link>
  );
}

export default Footer;