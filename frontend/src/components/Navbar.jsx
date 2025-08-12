// frontend/src/components/Navbar.jsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Menu, X, Search, UserCircle, LogIn, Sun, Moon, Home, Bookmark, User, ChevronDown, Sparkles, Film, Layers } from 'lucide-react';
import GenreSearchModal from './GenreSearchModal';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  const handleGenreSearch = ({ movieGenres, tvGenres, language }) => {
    setGenreModalOpen(false);
    // Build query string for movies and tv genres
    const params = new URLSearchParams();
    if (movieGenres && movieGenres.length > 0) params.append('movieGenres', movieGenres.join(','));
    if (tvGenres && tvGenres.length > 0) params.append('tvGenres', tvGenres.join(','));
    if (language) params.append('language', language);
    if (params.toString()) {
      if (router) router.push(`/search?${params.toString()}`);
    }
  };
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const searchOverlayRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Enhanced scroll effects with progress
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;
      setScrollPct(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchOpen) {
        const insideOverlay = searchOverlayRef.current && searchOverlayRef.current.contains(e.target);
        const insideBtn = searchRef.current && searchRef.current.contains(e.target);
        if (!insideOverlay && !insideBtn) setSearchOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen, profileOpen]);

  // Lock scroll when overlays open
  useEffect(() => {
    const anyOpen = menuOpen || searchOpen;
    document.documentElement.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [menuOpen, searchOpen]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
        setProfileOpen(false);
      }
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setProfileOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
  };

  // Enhanced nav links with colors
  const navLinks = useMemo(
    () => [
      { href: '/', label: 'Home', Icon: Home, color: '#3b82f6' },
      { href: '/watchlist', label: 'Watchlist', Icon: Bookmark, color: '#06b6d4' },
      ...(isAuthenticated ? [{ href: '/profile', label: 'Profile', Icon: User, color: '#10b981' }] : []),
    ],
    [isAuthenticated]
  );

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Enhanced animation variants
  const navbarVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const menuVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: 'easeInOut',
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const searchVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: -20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  const profileVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      rotateX: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      rotateX: -10,
      transition: { duration: 0.15 }
    }
  };

  // Hide navbar on specific routes (kept from your original)
  const isDetailPage = pathname.startsWith('/details/');
  if (isDetailPage) return null;

  return (
    <>
      {/* Enhanced Navbar */}
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navbarVariants}
        className={`fixed top-0 w-full z-[60] transition-all duration-500 ${scrolled
          ? 'backdrop-blur-2xl bg-[color:var(--color-background-primary)]/80 shadow-2xl border-b border-[color:var(--color-background-tertiary)]/30'
          : 'bg-transparent'
          }`}
        role="navigation"
        aria-label="Primary"
      >

        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 md:py-4">
          {/* Enhanced Brand */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="cursor-pointer select-none"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-3 font-extrabold tracking-wide text-xl sm:text-2xl"
              aria-label="Go to home"
            >
              <div className="relative">
                <motion.div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, #8b5cf6))'
                  }}
                  whileHover={{ rotate: 10 }}
                  animate={{
                    boxShadow: [
                      '0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent)',
                      '0 0 30px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                      '0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent)'
                    ]
                  }}
                  transition={{
                    boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  }}
                >
                  <div>
                    <img src="/logo.png" alt="CineMaster Logo" className="w-10 h-10 rounded-xl shadow-lg" />
                  </div>
                </motion.div>
              </div>
              <motion.span
                className="bg-clip-text text-transparent bg-gradient-to-r from-[color:var(--color-accent)] to-[color:var(--color-text-secondary)]"
                style={{
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                CineMaster
              </motion.span>
            </Link>
          </motion.div>

          {/* Enhanced Desktop links */}
          <motion.div
            variants={itemVariants}
            className="hidden md:flex items-center gap-2 lg:gap-3"
          >
            <div className="relative flex items-center gap-1">
              {navLinks.map(({ href, label, Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group relative px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer
                    ${isActive(href)
                      ? 'text-[color:var(--color-accent)]'
                      : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]'}`}
                  aria-current={isActive(href) ? 'page' : undefined}
                  onMouseEnter={() => setHoveredItem(href)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <motion.div
                    className="inline-flex items-center gap-2 text-sm font-medium relative z-10"
                    whileHover={{ y: -1 }}
                  >
                    <Icon size={18} />
                    {label}
                  </motion.div>

                  {/* Enhanced Background */}
                  <AnimatePresence>
                    {(isActive(href) || hoveredItem === href) && (
                      <motion.span
                        layoutId="nav-bg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: isActive(href)
                            ? `linear-gradient(135deg, color-mix(in srgb, ${color} 20%, transparent), color-mix(in srgb, ${color} 10%, transparent))`
                            : `linear-gradient(135deg, color-mix(in srgb, ${color} 15%, transparent), color-mix(in srgb, ${color} 5%, transparent))`,
                          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {isActive(href) && (
                    <motion.div
                      className="absolute -bottom-[3px] left-1/2 w-1 h-1 rounded-full bg-[color:var(--color-accent)]"
                      initial={{ scale: 0, x: '-50%' }}
                      animate={{ scale: 1, x: '-50%' }}
                      layoutId="active-dot"
                    />
                  )}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Right actions */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-1 sm:gap-2"
          >

            {/* Enhanced Search */}
            <div className="relative flex items-center gap-1">
              <motion.button
                ref={searchRef}
                onClick={() => {
                  setSearchOpen((v) => !v);
                  setProfileOpen(false);
                  setMenuOpen(false);
                }}
                className="relative p-2.5 rounded-full transition-all text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] hover:text-[color:var(--color-text-primary)] group"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Search"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[color:var(--color-accent)]/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Search size={22} className="relative z-10" />
                {/* Keyboard shortcut hint */}
                <motion.div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-[color:var(--color-background-tertiary)] text-xs text-[color:var(--color-text-secondary)] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  initial={{ y: 5, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                >
                  {typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                </motion.div>
              </motion.button>
              {/* Genre Search Icon */}
              <motion.button
                onClick={() => {
                  setGenreModalOpen(true);
                  setSearchOpen(false);
                  setProfileOpen(false);
                  setMenuOpen(false);
                }}
                className="relative p-2.5 rounded-full transition-all text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] hover:text-[color:var(--color-accent)] group"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Search by Genre"
                title="Search by Genre"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[color:var(--color-accent)]/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Layers size={22} className="relative z-10" />
              </motion.button>
            </div>
            {/* Genre Search Modal */}
            <GenreSearchModal
              open={genreModalOpen}
              onClose={() => setGenreModalOpen(false)}
              onSearch={handleGenreSearch}
            />

            {/* Enhanced Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2.5 rounded-full transition-colors text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] hover:text-[color:var(--color-accent)]"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </motion.button>

            {/* Enhanced Auth section */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <motion.button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 p-1.5 rounded-full transition-all hover:bg-[color:var(--color-background-secondary)] group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[color:var(--color-text-primary)] group-hover:ring-[color:var(--color-accent)] transition-all">
                      {user?.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="avatar" width={36} height={36} className="rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[color:var(--color-accent)] to-purple-600 flex items-center justify-center">
                          <UserCircle size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[color:var(--color-background-primary)]" />
                  </div>
                  <motion.div
                    animate={{ rotate: profileOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="hidden sm:block"
                  >
                    <ChevronDown size={16} className="text-[color:var(--color-text-secondary)]" />
                  </motion.div>
                </motion.button>

                {/* Enhanced Profile Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={profileVariants}
                      className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl border bg-[color:var(--color-background-secondary)]/95 border-[color:var(--color-background-tertiary)]/50 backdrop-blur-2xl"
                      role="menu"
                    >
                      {/* Profile Header */}
                      <div className="p-4 border-b border-[color:var(--color-background-tertiary)]/50">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-bold text-[color:var(--color-text-primary)]">{user?.name || 'User'}</p>
                            <p className="text-sm text-[color:var(--color-text-secondary)]/80">{user?.email || 'user@example.com'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={closeAll}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[color:var(--color-background-tertiary)] hover:text-[color:var(--color-accent)] text-[color:var(--color-text-secondary)] group"
                          role="menuitem"
                        >
                          <User size={18} />
                          <span>My Profile</span>
                          <motion.div
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ x: 2 }}
                          >
                            →
                          </motion.div>
                        </Link>
                        <Link
                          href="/watchlist"
                          onClick={closeAll}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[color:var(--color-background-tertiary)] hover:text-[color:var(--color-accent)] text-[color:var(--color-text-secondary)] group"
                          role="menuitem"
                        >
                          <Bookmark size={18} />
                          <span>Watchlist</span>
                          <motion.div
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ x: 2 }}
                          >
                            →
                          </motion.div>
                        </Link>

                        <div className="my-2 h-px bg-[color:var(--color-background-tertiary)]/50" />

                        <motion.button
                          onClick={() => {
                            logout();
                            closeAll();
                          }}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-red-500/20 hover:text-red-400 text-[color:var(--color-text-secondary)] group"
                          role="menuitem"
                          whileHover={{ x: 2 }}
                        >
                          <LogIn size={18} />
                          <span>Sign Out</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={closeAll}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2"
                >
                  <LogIn size={18} />
                  <span>Login / Sign Up</span>
                </motion.div>
              </Link>
            )}

            {/* Enhanced Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => {
                  setMenuOpen(true);
                  setSearchOpen(false);
                  setProfileOpen(false);
                }}
                className="p-2.5 rounded-full transition-all text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)]"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Open menu"
              >
                <Menu size={24} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.nav>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[70] md:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
          >
            {/* Enhanced backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAll}
            />

            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-[color:var(--color-background-primary)]/95 backdrop-blur-2xl border-t border-[color:var(--color-background-tertiary)] shadow-2xl p-6"
              variants={menuVariants}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-lg text-[color:var(--color-text-primary)]">Menu</span>
                <motion.button
                  onClick={closeAll}
                  className="p-2 rounded-full text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)]"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="grid gap-4">
                {navLinks.map(({ href, label, Icon, color }, index) => (
                  <motion.div
                    key={href}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={href}
                      onClick={closeAll}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isActive(href)
                        ? 'border-[color:var(--color-accent)] text-[color:var(--color-accent)]'
                        : 'border-[color:var(--color-background-tertiary)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)]'
                        }`}
                      style={{
                        background: isActive(href)
                          ? `linear-gradient(135deg, color-mix(in srgb, ${color} 15%, transparent), color-mix(in srgb, ${color} 5%, transparent))`
                          : 'transparent'
                      }}
                    >
                      <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Icon size={20} style={{ color }} />
                      </motion.div>
                      <span className="text-base font-medium">{label}</span>
                    </Link>
                  </motion.div>
                ))}

                {!isAuthenticated ? (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: navLinks.length * 0.1 }}
                  >
                    <Link
                      href="/login"
                      onClick={closeAll}
                      className="mt-2 inline-flex items-center justify-center gap-2 p-4 rounded-2xl text-white"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <LogIn size={20} />
                      <span className="text-base font-medium">Login / Sign Up</span>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: navLinks.length * 0.1 }}
                  >
                    <button
                      onClick={() => {
                        logout();
                        closeAll();
                      }}
                      className="mt-2 w-full inline-flex items-center justify-center gap-2 p-4 rounded-2xl text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <LogIn size={20} />
                      <span className="text-base font-medium">Sign Out</span>
                    </button>
                  </motion.div>
                )}

                {/* Theme toggle in mobile menu */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: (navLinks.length + 1) * 0.1 }}
                >
                  <button
                    onClick={toggleTheme}
                    className="mt-1 w-full inline-flex items-center justify-center gap-2 p-4 rounded-2xl border border-[color:var(--color-background-tertiary)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: isDarkMode ? 0 : 180 }}
                      transition={{ duration: 0.5 }}
                    >
                      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.div>
                    <span className="text-base font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={searchVariants}
          >
            {/* Enhanced backdrop */}
            <motion.div
              className="absolute inset-0 bg-[color:var(--color-background-primary)]/80 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />

            <motion.div
              ref={searchOverlayRef}
              className="relative w-11/12 md:w-3/4 lg:w-1/2 rounded-2xl shadow-2xl bg-[color:var(--color-background-secondary)]/95 border border-[color:var(--color-background-tertiary)]/50 backdrop-blur-2xl overflow-hidden"
              variants={searchVariants}
            >
              {/* Search header with gradient */}
              <div className="relative p-6 bg-gradient-to-r from-[color:var(--color-accent)]/10 to-purple-500/10 border-b border-[color:var(--color-background-tertiary)]/30">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Search size={24} className="text-[color:var(--color-accent)]" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)] mb-1">
                      Search Movies & TV Shows
                    </h3>
                    <p className="text-sm text-[color:var(--color-text-secondary)]/70">
                      Find your next favorite content
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setSearchOpen(false)}
                    className="p-2 rounded-xl text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-tertiary)] hover:text-[color:var(--color-text-primary)] transition-colors"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close search"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Search content */}
              <div className="p-6">
                <SearchBar onSearchSubmit={() => setSearchOpen(false)} />

                {/* Quick search suggestions */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-3">
                    Popular Searches
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['Trending Movies', 'Popular TV Shows', 'New Releases', 'Top Rated'].map((suggestion, index) => (
                      <motion.button
                        key={suggestion}
                        className="text-left p-3 rounded-xl bg-[color:var(--color-background-tertiary)]/30 hover:bg-[color:var(--color-background-tertiary)]/50 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)] transition-all group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="w-2 h-2 rounded-full bg-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.2 }}
                          />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;