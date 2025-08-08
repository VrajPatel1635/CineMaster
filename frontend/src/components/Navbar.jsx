// frontend/src/components/Navbar.jsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, UserCircle, LogIn, Sun, Moon, Home, Bookmark, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const pathname = usePathname();

    const { isDarkMode, toggleTheme } = useTheme();

    const searchRef = useRef(null);
    const profileRef = useRef(null);
    const searchOverlayRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (searchOpen && searchOverlayRef.current && !searchOverlayRef.current.contains(e.target) && searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
            if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [searchOpen, profileOpen]);

    const closeAll = () => {
        setMenuOpen(false);
        setSearchOpen(false);
        setProfileOpen(false);
    };

    const menuVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
        exit: { x: '100%', transition: { duration: 0.3, ease: 'easeIn' } }
    };

    const searchVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
    };

    const profileVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    // Check if the current path is a movie/tv detail page
    const isDetailPage = pathname.startsWith('/details/');

    if (isDetailPage) {
        return null;
    }

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-xl bg-[color:var(--color-background-primary)]/70 shadow-lg" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer">
                    <Link href="/" className="text-3xl font-bold tracking-wider text-[color:var(--color-accent)]">
                        CineMaster
                    </Link>
                </motion.div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="group relative flex items-center space-x-2 px-3 py-2 text-[color:var(--color-text-secondary)] transition-colors duration-300 hover:text-[color:var(--color-accent)] cursor-pointer">
                        <Home size={18} />
                        <span>Home</span>
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[color:var(--color-accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                    <Link href="/watchlist" className="group relative flex items-center space-x-2 px-3 py-2 text-[color:var(--color-text-secondary)] transition-colors duration-300 hover:text-[color:var(--color-accent)] cursor-pointer">
                        <Bookmark size={18} />
                        <span>Watchlist</span>
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[color:var(--color-accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                    {isAuthenticated && (
                        <Link href="/profile" className="group relative flex items-center space-x-2 px-3 py-2 text-[color:var(--color-text-secondary)] transition-colors duration-300 hover:text-[color:var(--color-accent)] cursor-pointer">
                            <User size={18} />
                            <span>Profile</span>
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[color:var(--color-accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </Link>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                    {/* Search Button */}
                    <motion.button
                        ref={searchRef}
                        onClick={() => { setSearchOpen(!searchOpen); setProfileOpen(false); setMenuOpen(false); }}
                        className="p-3 rounded-full transition-colors duration-300 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] hover:text-[color:var(--color-text-primary)] cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Search size={22} />
                    </motion.button>

                    {/* Theme Toggle */}
                    <motion.button
                        onClick={toggleTheme}
                        className="p-3 rounded-full transition-colors duration-300 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] hover:text-[color:var(--color-accent)] cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
                    </motion.button>

                    {/* Authentication */}
                    {isAuthenticated ? (
                        <div className="relative" ref={profileRef}>
                            <motion.div
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer overflow-hidden ring-2 ring-[color:var(--color-text-primary)] hover:ring-[color:var(--color-accent)] transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {user?.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt="avatar" width={40} height={40} className="rounded-full" />
                                ) : <UserCircle size={28} className="text-[color:var(--color-background-primary)] bg-[color:var(--color-text-primary)] rounded-full" />}
                            </motion.div>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={profileVariants}
                                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-2xl overflow-hidden bg-[color:var(--color-background-secondary)] border border-[color:var(--color-background-tertiary)]"
                                    >
                                        <div className="px-4 py-3 border-b border-[color:var(--color-background-tertiary)]">
                                            <p className="font-bold text-[color:var(--color-text-primary)]">{user?.name || "User"}</p>
                                            <p className="text-sm text-[color:var(--color-text-secondary)]">{user?.email || "user@example.com"}</p>
                                        </div>
                                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-[color:var(--color-background-tertiary)] hover:text-[color:var(--color-accent)] text-[color:var(--color-text-secondary)] cursor-pointer" onClick={closeAll}>
                                            <User size={18} /> My Profile
                                        </Link>
                                        <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-[color:var(--color-background-tertiary)] hover:text-[color:var(--color-accent)] text-[color:var(--color-text-secondary)] cursor-pointer" onClick={closeAll}>
                                            <Bookmark size={18} /> Watchlist
                                        </Link>
                                        <button onClick={() => { logout(); closeAll(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-red-500 hover:text-white text-[color:var(--color-text-secondary)] cursor-pointer">
                                            <LogIn size={18} /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link href="/login" onClick={closeAll} className="hidden md:flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer">
                            <LogIn size={18} />
                            <span>Login / Sign Up</span>
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <motion.button
                            onClick={() => { setMenuOpen(true); setSearchOpen(false); setProfileOpen(false); }}
                            className="p-3 rounded-full transition-colors duration-300 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-secondary)] cursor-pointer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <AnimatePresence mode="wait">
                                {menuOpen ? (
                                    <motion.div key="x-icon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <X size={24} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="menu-icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Menu size={24} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div className="fixed inset-0 flex flex-col items-center justify-center md:hidden bg-[color:var(--color-background-primary)]/95 backdrop-blur-xl" variants={menuVariants} initial="hidden" animate="visible" exit="exit">
                        <motion.button onClick={closeAll} className="absolute top-4 right-4 text-[color:var(--color-text-primary)] p-2 rounded-full hover:bg-[color:var(--color-background-secondary)] transition-colors cursor-pointer" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                            <X size={30} />
                        </motion.button>
                        <div className="space-y-8 text-center mt-10">
                            <Link href="/" onClick={closeAll} className="text-3xl font-medium transition flex items-center justify-center space-x-3 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]">
                                <Home size={32} />
                                <span>Home</span>
                            </Link>
                            <Link href="/watchlist" onClick={closeAll} className="text-3xl font-medium transition flex items-center justify-center space-x-3 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]">
                                <Bookmark size={32} />
                                <span>Watchlist</span>
                            </Link>
                            {isAuthenticated ? (
                                <>
                                    <Link href="/profile" onClick={closeAll} className="text-3xl font-medium transition flex items-center justify-center space-x-3 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]">
                                        <User size={32} />
                                        <span>Profile</span>
                                    </Link>
                                    <button onClick={() => { logout(); closeAll(); }} className="text-3xl w-full font-medium transition flex items-center justify-center space-x-3 text-[color:var(--color-text-secondary)] hover:text-red-500 cursor-pointer">
                                        <LogIn size={32} />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link href="/login" onClick={closeAll} className="text-3xl font-medium transition flex items-center justify-center space-x-3 text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]">
                                    <LogIn size={32} />
                                    <span>Login / Sign Up</span>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center bg-[color:var(--color-background-primary)]/80" initial="hidden" animate="visible" exit="exit" variants={searchVariants}>
                        <motion.div ref={searchOverlayRef} className="w-11/12 md:w-2/3 p-4 rounded-xl shadow-2xl relative bg-[color:var(--color-background-secondary)]">
                            <SearchBar onSearchSubmit={closeAll} />
                            <motion.button onClick={() => setSearchOpen(false)} className="absolute top-4 right-4 p-2 rounded-full text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background-tertiary)] transition-colors cursor-pointer" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                <X size={24} />
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;