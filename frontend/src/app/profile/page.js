// frontend/src/app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaSpinner, FaEdit, FaCheck, FaTimes, FaTrashAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";


export default function ProfilePage() {
    const { user, isAuthenticated, logout, authLoading, token } = useAuth();
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [clearingHistory, setClearingHistory] = useState(false);
    const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(user?.name || user?.email?.split('@')[0] || '');
    const [savingName, setSavingName] = useState(false);

    const getAuthConfig = () => {
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    };

    // The first useEffect should always be called.
    useEffect(() => {
        console.log("isAuthenticated:", isAuthenticated);
        console.log("user:", user);
        console.log("token:", token);
        if (authLoading) {
            return;
        }

        // The conditional logic is now inside the hook.
        if (isAuthenticated && user && user._id && token) {
            const fetchHistory = async () => {
                setHistoryLoading(true);
                try {
                    console.log(`[FRONTEND] Fetching history for user: ${user._id}`);
                    const response = await axios.get(
                        `http://localhost:5000/api/history/${user._id}`,
                        getAuthConfig()
                    );
                    setHistory(response.data);
                } catch (error) {
                    console.error('[FRONTEND] Failed to fetch user history:', error);
                    if (axios.isAxiosError(error) && error.response) {
                        if (error.response.status === 401 || error.response.status === 403) {
                            toast.error("Authentication required to load history. Please log in.", { duration: 5000 });
                            setHistory([]);
                        } else {
                            toast.error("Failed to load history. Please try again.", { duration: 5000 });
                        }
                    } else {
                        toast.error("Network error. Could not connect to the server.", { duration: 5000 });
                    }
                    setHistory([]);
                } finally {
                    setHistoryLoading(false);
                }
            };
            fetchHistory();
        } else if (!isAuthenticated) {
            setHistoryLoading(false);
            setHistory([]);
        }
    }, [isAuthenticated, user, authLoading, token]);

    // This second useEffect is fine because it's at the top level.
    useEffect(() => {
        setNameInput(user?.name || user?.email?.split('@')[0] || '');
    }, [user]);

    // ... rest of the component code (handleClearHistory, handleSaveName, etc.)
    // ... the return statement

    const handleClearHistory = async () => {
        if (!user || !user._id || !token) {
            console.warn("User ID or token not available for clearing history.");
            toast.error("Please log in to clear history.");
            return;
        }
        setShowConfirmClearModal(true);
    };

    const confirmClearAction = async () => {
        setShowConfirmClearModal(false);
        setClearingHistory(true);
        const loadingToastId = toast.loading("Clearing history...");
        try {
            await axios.delete(
                `http://localhost:5000/api/history/${user._id}`,
                getAuthConfig()
            );
            setHistory([]);
            toast.success("Viewing history cleared successfully!", { id: loadingToastId });
        } catch (error) {
            console.error('[FRONTEND] Failed to clear user history:', error);
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.error("Authentication required to clear history.", { id: loadingToastId, duration: 5000 });
                } else {
                    toast.error("Failed to clear history. Please try again.", { id: loadingToastId, duration: 5000 });
                }
            } else {
                toast.error("Network error. Could not connect to the server.", { id: loadingToastId, duration: 5000 });
            }
        } finally {
            setClearingHistory(false);
        }
    };

    const cancelClearAction = () => {
        setShowConfirmClearModal(false);
    };

    if (authLoading) {
        return <div className="h-screen flex items-center justify-center text-xl text-[var(--color-text-primary)]">Loading profile...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-xl text-[var(--color-text-secondary)]">
                <p className="font-bold text-2xl mb-4">You are not logged in.</p>
                <p>Please log in to view your profile and history.</p>
            </div>
        );
    }

    const userEmail = user?.email || 'No email available';

    async function handleSaveName() {
        setSavingName(true);
        try {
            const res = await axios.patch('http://localhost:5000/api/user/name', { name: nameInput }, getAuthConfig());
            toast.success('Name updated!');
            // Update user context if possible
            if (res.data && res.data.user) {
                if (typeof window !== 'undefined') {
                    // Update localStorage if used for user
                    const storedUser = window.localStorage.getItem('user');
                    if (storedUser) {
                        const updatedUser = { ...JSON.parse(storedUser), name: res.data.user.name };
                        window.localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                }
                // If useAuth provides a setUser, call it
                if (typeof setUser === 'function') {
                    setUser((prev) => ({ ...prev, name: res.data.user.name }));
                }
            }
            setEditingName(false);
        } catch (err) {
            toast.error('Failed to update name');
        } finally {
            setSavingName(false);
        }
    }

    function handleCancelEdit() {
        setEditingName(false);
        setNameInput(user?.name || userEmail.split('@')[0] || '');
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-20 p-8 md:p-16 min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
        >
            <div className="max-w-4xl mx-auto pt-10">
                <div className="flex flex-col md:flex-row items-center justify-between border-b pb-8 mb-8 border-[var(--color-border)]">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-2 mb-2">
                            {editingName ? (
                                <>
                                    <input
                                        type="text"
                                        value={nameInput}
                                        onChange={e => setNameInput(e.target.value)}
                                        className="text-4xl md:text-5xl font-extrabold bg-transparent border-b-2 border-[var(--color-accent)] focus:outline-none px-2 py-1 w-48 md:w-64"
                                        disabled={savingName}
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        className="ml-2 text-green-600 hover:text-green-800"
                                        disabled={savingName}
                                    >
                                        <FaCheck />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="ml-1 text-red-600 hover:text-red-800"
                                        disabled={savingName}
                                    >
                                        <FaTimes />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-4xl md:text-5xl font-extrabold">{user?.name || userEmail.split('@')[0]}</h1>
                                    <button
                                        onClick={() => setEditingName(true)}
                                        className="ml-2 text-[var(--color-accent)] hover:text-[var(--color-accent-dark)] cursor-pointer"
                                        title="Edit Name"
                                    >
                                        <FaEdit />
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-lg text-[var(--color-text-secondary)]">{userEmail}</p>
                    </div>
                    <motion.button
                        onClick={logout}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all duration-300 bg-gray-800 text-white shadow-lg hover:bg-red-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer"
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 20px 5px rgba(239, 68, 68, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Log Out
                    </motion.button>
                </div>

                <div className="space-y-8">
                    <h2 className="text-3xl font-bold border-b pb-4 border-[var(--color-border)] flex justify-between items-center">
                        Your Viewing History
                        <motion.button
                            onClick={handleClearHistory}
                            className="ml-4 px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:bg-red-700"
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 10px 20px rgba(239, 68, 68, 0.6)",
                                y: -2
                            }}
                            whileTap={{
                                scale: 0.95,
                                y: 0
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 10
                            }}
                            disabled={historyLoading || clearingHistory || history.length === 0}
                        >
                            {clearingHistory ? (
                                <FaSpinner className="animate-spin" />
                            ) : (
                                <>
                                    <FaTrashAlt />
                                    <span>Clear History</span>
                                </>
                            )}
                        </motion.button>
                    </h2>

                    {historyLoading ? (
                        <div className="text-center text-[var(--color-text-secondary)] flex items-center justify-center py-10">
                            <FaSpinner className="animate-spin text-2xl mr-2" /> Loading history...
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map((movie) => (
                                <Link href={`/movie/${movie.id}?media_type=movie`} key={movie.id} passHref>
                                    <div className="bg-[var(--color-background-secondary)] rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105 group cursor-pointer">
                                        <div className="relative w-full h-64">
                                            <Image
                                                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/images/placeholder-poster.png'}
                                                alt={movie.title}
                                                layout="fill"
                                                objectFit="cover"
                                                className="transition-transform duration-300 group-hover:scale-110"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-poster.png'; }}
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-xl font-bold truncate">{movie.title}</h3>
                                            <p className="text-sm text-[var(--color-text-secondary)]">
                                                Watched: {new Date(movie.viewedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-[var(--color-text-secondary)] py-10">
                            <p>You haven't viewed any movies yet. Start Browse to build your history!</p>
                        </div>
                    )}
                </div>
            </div>

            {showConfirmClearModal && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-lg bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-[var(--color-background-secondary)] rounded-lg p-6 shadow-xl max-w-sm w-full text-center border border-[var(--color-border)]"
                    >
                        <h3 className="text-xl font-bold mb-4 text-[var(--color-accent)]">Confirm Clear History</h3>
                        <p className="text-[var(--color-text-primary)] mb-6">
                            Are you sure you want to clear your entire viewing history? This action cannot be undone.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <motion.button
                                onClick={confirmClearAction}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-5 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors"
                            >
                                Yes, Clear
                            </motion.button>
                            <motion.button
                                onClick={cancelClearAction}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-5 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}