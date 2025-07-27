'use client';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="mt-6 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-300 border-t border-gray-200 dark:border-zinc-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
          CineMaster
        </Link>

        {/* Footer Navigation */}
        <div className="flex gap-6 text-sm">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</Link>
          <Link href="/search" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Search</Link>
          <Link href="/watchlist" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Watchlist</Link>
          <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Login</Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} CineMaster. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
