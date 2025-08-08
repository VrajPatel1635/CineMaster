// frontend/src/components/Footer.jsx
'use client';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer
      className="
                 bg-[var(--color-background-secondary)]
                 text-[var(--color-text-primary)]
                 border-t border-[var(--color-text-secondary)]
                 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo / Brand - using the accent color variable */}
        <Link
          href="/"
          className="text-xl font-semibold
                     text-[var(--color-accent)]
                     transition-colors duration-300"
        >
          CineMaster
        </Link>

        {/* Footer Navigation - using accent color for hover state */}
        <div className="flex gap-6 text-sm">
          <Link
            href="/"
            className="hover:text-[var(--color-accent)] transition-colors duration-300"
          >
            Home
          </Link>
          <Link
            href="/search"
            className="hover:text-[var(--color-accent)] transition-colors duration-300"
          >
            Search
          </Link>
          <Link
            href="/watchlist"
            className="hover:text-[var(--color-accent)] transition-colors duration-300"
          >
            Watchlist
          </Link>
          <Link
            href="/login"
            className="hover:text-[var(--color-accent)] transition-colors duration-300"
          >
            Login
          </Link>
        </div>

        {/* Copyright - using the secondary text color for a subtle look */}
        <p className="text-xs
                      text-[var(--color-text-secondary)]">
          &copy; {new Date().getFullYear()} CineMaster. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;