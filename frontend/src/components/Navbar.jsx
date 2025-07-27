// src/components/Navbar.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Search, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import Portal from './Portal';
// import MagneticButton from './MagneticButton'; // <--- REMOVED: MagneticButton import

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchIconRef = useRef(null);
  const [searchDropdownPos, setSearchDropdownPos] = useState({ top: 0, right: 0, width: 0 });

  const closeAllMenus = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const calculateDropdownPosition = () => {
    if (searchIconRef.current) {
      const rect = searchIconRef.current.getBoundingClientRect();
      setSearchDropdownPos({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeAllMenus();
      }
    };

    const handleClickOutside = (event) => {
      if (
        searchOpen &&
        searchIconRef.current && !searchIconRef.current.contains(event.target) &&
        !event.target.closest('.search-dropdown-portal')
      ) {
        setSearchOpen(false);
      }
    };

    if (searchOpen || menuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [searchOpen, menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      setSearchOpen(false);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) {
      setMenuOpen(false);
      calculateDropdownPosition();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleResizeOrScroll = () => {
      if (searchOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, [searchOpen]);

  // Framer Motion variants
  const menuOverlayVariants = {
    hidden: { x: '100%', opacity: 0, transition: { type: "tween", ease: "easeOut", duration: 0.4 } },
    visible: { x: '0%', opacity: 1, transition: { type: "tween", ease: "easeOut", duration: 0.5 } },
  };

  const menuLinkVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const searchDropdownVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  };

  // NavLinkItem Component with "pill" hover effect (remains unchanged)
  const NavLinkItem = ({ href, children }) => (
    <Link
      href={href}
      onClick={closeAllMenus}
      className="relative group block overflow-hidden"
    >
      <motion.span
        className="relative z-10 block px-4 py-2 rounded-full text-text-primary text-lg font-semibold"
        initial={{ color: 'var(--color-text-primary)' }}
        whileHover={{ color: 'var(--color-background-primary)' }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.span>
      <motion.span
        className="absolute inset-0 bg-accent rounded-full z-0"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ originX: 0.5 }}
      />
    </Link>
  );

  return (
    <nav className="
      bg-[#161B22] backdrop-blur-md
      shadow-lg shadow-text-primary/10 dark:shadow-text-primary/20
      transition duration-300
      fixed w-full z-50
      py-4 sm:py-3
    ">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="
            text-3xl sm:text-2xl font-extrabold tracking-wide
            text-accent hover:text-accent/80 transition-opacity
          ">
            CineMaster
          </Link>
        </motion.div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <NavLinkItem href="/">Home</NavLinkItem>
          <NavLinkItem href="/watchlist">Watchlist</NavLinkItem>
          <NavLinkItem href="/about">About</NavLinkItem>
          <NavLinkItem href="/login">
            <span className="flex items-center gap-2">
              <LogIn size={20} className="hidden lg:inline" />
              Login / Sign Up
            </span>
          </NavLinkItem>
        </div>

        {/* Right-side Utility Icons (Search, Theme, Menu Toggle) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Icon (reverted from MagneticButton) */}
          <motion.button
            ref={searchIconRef}
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-text-primary hover:text-accent transition-colors p-2 rounded-full hover:bg-background-primary/50 cursor-pointer"
            aria-label="Toggle search"
            whileHover={{ scale: 1.1 }} // Re-added original hover animation
            whileTap={{ scale: 0.9 }}  // Re-added original tap animation
          >
            <Search size={24} />
          </motion.button>

          {/* Theme Toggle (reverted from MagneticButton) */}
          <div className="flex justify-center"> {/* Keep the div wrapper for ThemeToggle */}
            <ThemeToggle /> {/* Assuming ThemeToggle is already a motion.button or has its own animations */}
          </div>

          {/* Mobile Menu Toggle Icon (reverted from MagneticButton) */}
          <motion.button
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-text-primary hover:text-accent transition-colors p-2 rounded-full hover:bg-background-primary/50"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            whileHover={{ scale: 1.1 }} // Re-added original hover animation
            whileTap={{ scale: 0.9 }}  // Re-added original tap animation
          >
            <Menu size={28} />
          </motion.button>
        </div>
      </div>

      {/* Full-Screen Mobile Navigation Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={`
              fixed inset-0 z-40 bg-background-primary
              flex flex-col items-center justify-center
              overflow-y-auto px-6 py-16
            `}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuOverlayVariants}
          >
            {/* Close Button for Full-Screen Menu (reverted from MagneticButton) */}
            <motion.button
              onClick={() => setMenuOpen(false)}
              className="absolute top-6 right-6 text-text-primary hover:text-accent transition-colors p-2 rounded-full hover:bg-background-secondary/50"
              aria-label="Close menu"
              whileHover={{ scale: 1.2, rotate: 90 }} // Re-added original hover animation
              whileTap={{ scale: 0.9 }}  // Re-added original tap animation
            >
              <X size={36} />
            </motion.button>

            <motion.div
              className="
                w-full max-w-sm
                grid grid-cols-1 gap-y-10
                text-center
                text-text-primary
              "
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              <div className="flex flex-col gap-6">
                <h3 className="text-text-secondary text-sm uppercase tracking-wider mb-2">Menu</h3>
                <motion.div variants={menuLinkVariants}>
                  <Link href="/" onClick={closeAllMenus} className="
                    text-4xl font-extrabold
                    hover:text-accent transition-colors duration-200 ease-in-out
                    leading-tight block
                  ">
                    Home
                  </Link>
                </motion.div>
                <motion.div variants={menuLinkVariants}>
                  <Link href="/watchlist" onClick={closeAllMenus} className="
                    text-4xl font-extrabold
                    hover:text-accent transition-colors duration-200 ease-in-out
                    leading-tight block
                  ">
                    Watchlist
                  </Link>
                </motion.div>
                <motion.div variants={menuLinkVariants}>
                  <Link href="/about" onClick={closeAllMenus} className="
                    text-4xl font-extrabold
                    hover:text-accent transition-colors duration-200 ease-in-out
                    leading-tight block
                  ">
                    About
                  </Link>
                </motion.div>
              </div>

              <div className="flex flex-col gap-6 mt-8">
                <h3 className="text-text-secondary text-sm uppercase tracking-wider mb-2">Account</h3>
                <motion.div variants={menuLinkVariants}>
                  <Link
                    href="/login"
                    onClick={closeAllMenus}
                    className="
                      text-4xl font-extrabold
                      hover:text-accent transition-colors duration-200 ease-in-out
                      leading-tight block
                    "
                  >
                    Login / Sign Up
                  </Link>
                </motion.div>
                <motion.div variants={menuLinkVariants}>
                  <Link
                    href="/settings"
                    onClick={closeAllMenus}
                    className="
                      text-4xl font-extrabold
                      hover:text-accent transition-colors duration-200 ease-in-out
                      leading-tight block
                    "
                  >
                    Settings
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar Pop-up rendered via Portal */}
      <AnimatePresence>
        {searchOpen && (
          <Portal wrapperId="search-dropdown-root">
            <motion.div
              className="
                search-dropdown-portal
                absolute
                bg-background-secondary p-4 rounded-lg shadow-xl
                border border-border
                z-[100]
                transform origin-top-right
                text-text-primary
              "
              style={{
                top: `${searchDropdownPos.top + 10}px`,
                right: `${searchDropdownPos.right - 10}px`,
                minWidth: `clamp(280px, 90vw, 450px)`
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={searchDropdownVariants}
            >
              <SearchBar onSearchSubmit={closeAllMenus} />
              <motion.button
                onClick={() => setSearchOpen(false)}
                className="absolute -top-3 -right-3 bg-accent text-white rounded-full p-1 leading-none"
                aria-label="Close search"
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;