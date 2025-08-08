// src/app/dashboard/page.js
'use client';

import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, isAuthenticated, authLoading } = useAuth();

    if (authLoading) {
        return <div className="h-screen flex items-center justify-center text-xl">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="h-screen flex flex-col items-center justify-center text-xl">Please log in to view your dashboard.</div>;
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 md:p-16 min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
        >
            <div className="max-w-4xl mx-auto pt-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 border-b pb-4 border-[var(--color-border)]">
                    Dashboard
                </h1>
                <p className="text-lg mb-8 text-[var(--color-text-secondary)]">
                    Welcome back, {user?.email.split('@')[0]}! Here's a quick overview of your CineMaster activity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card for Profile */}
                    <Link href="/profile" passHref>
                        <motion.div 
                            className="bg-[var(--color-background-secondary)] rounded-xl p-8 shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className="text-2xl font-bold mb-2">My Profile</h2>
                            <p className="text-[var(--color-text-secondary)]">View your personal information and movie history.</p>
                        </motion.div>
                    </Link>

                    {/* Card for Recommendations */}
                    <Link href="/#recommendations" passHref>
                        <motion.div 
                            className="bg-[var(--color-background-secondary)] rounded-xl p-8 shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <h2 className="text-2xl font-bold mb-2">Your Recommendations</h2>
                            <p className="text-[var(--color-text-secondary)]">See personalized movie suggestions based on your tastes.</p>
                        </motion.div>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
