// frontend/src/app/watchlist/page.js
'use client';

import { useEffect, useState } from 'react';
import useUser from '../../hooks/useUser';
import MovieCard from '../../components/MovieCard';
import MovieCardSkeleton from '@/components/MovieCardSkeleton';
import { FaSpinner, FaListUl, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const serverUrl = 'http://localhost:5000';

const WatchlistPage = () => {
    const { userId, isAuthenticated, isLoading } = useUser();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingMovieId, setRemovingMovieId] = useState(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false); // New state for modal

    const { token } = useAuth();

    const fetchWatchlist = async (id) => {
        if (!id) {
            console.error("Fetch Watchlist: userId is missing.");
            setLoading(false);
            setWatchlist([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log(`[FRONTEND] Fetching watchlist for user: ${id}`);
            const res = await fetch(`${serverUrl}/api/watchlist/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[FRONTEND] Watchlist fetched successfully:", data);
                if (data.length === 0) {
                    console.warn("[FRONTEND] Watchlist is empty. No movies found for this user.");
                }
                setWatchlist(data);
            } else {
                const errorText = await res.text();
                console.error(`[FRONTEND] Failed to fetch watchlist. Status: ${res.status}, Response:`, errorText);
                setError("Failed to load your watchlist. Please check the backend server logs.");
                setWatchlist([]);
            }
        } catch (err) {
            console.error("[FRONTEND] Network error while fetching watchlist:", err);
            setError("Network error. Could not connect to the server.");
            setWatchlist([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMovie = async (movieId) => {
        if (!userId) {
            console.error("Remove Movie: userId is missing.");
            return;
        }

        setRemovingMovieId(movieId);
        try {
            console.log(`[FRONTEND] Attempting to remove movie ID ${movieId} for user ${userId}`);
            const res = await fetch(`${serverUrl}/api/watchlist/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ userId, movieId })
            });
            if (res.ok) {
                console.log(`[FRONTEND] Movie ID ${movieId} removed successfully.`);
                await fetchWatchlist(userId);
            } else {
                const errorText = await res.text();
                console.error(`[FRONTEND] Failed to remove movie. Status: ${res.status}, Response:`, errorText);
                setError(`Failed to remove movie. Server responded with: ${res.status} ${errorText}`);
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error("[FRONTEND] Network error while removing movie:", err);
            setError("Network error. Could not connect to the server.");
            setTimeout(() => setError(null), 5000);
        } finally {
            setRemovingMovieId(null);
        }
    };

    const handleClearWatchlist = () => {
        setIsClearModalOpen(true);
    };

    const confirmClearWatchlist = async () => {
        setIsClearModalOpen(false); // Close the modal first
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${serverUrl}/api/watchlist/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                setWatchlist([]);
            } else {
                const errorText = await res.text();
                setError('Failed to clear watchlist.');
                console.error('Failed to clear watchlist:', errorText);
            }
        } catch (err) {
            setError('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            setWatchlist([]);
            setLoading(false);
            return;
        }
        if (isAuthenticated && userId && !isLoading) {
            fetchWatchlist(userId);
        } else if (!isLoading) {
            setLoading(false);
        }
    }, [userId, isAuthenticated, isLoading]);

    const handleRefresh = () => {
        if (isAuthenticated && userId) {
            fetchWatchlist(userId);
        }
    };

    if (!isAuthenticated && !isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-xl text-[var(--color-text-secondary)]">
                <p className="font-bold text-2xl mb-4">You are not logged in.</p>
                <p>Please log in to view your watchlist.</p>
            </div>
        );
    }
    return (
        <div className="p-6 pt-20 min-h-screen">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-100">Your Watchlist</h1>
                <div className="flex gap-2 pt-5">
                    <motion.button
                        whileHover={{ boxShadow: '0 0 10px 4px #a855f7', scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRefresh}
                        disabled={loading || isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                        <FaSyncAlt className={loading ? "animate-spin" : ""} />
                        Refresh
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearWatchlist}
                        disabled={loading || isLoading || watchlist.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                        <FaTrash />
                        Clear Watchlist
                    </motion.button>
                </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
                User ID: <span className="font-mono text-gray-200">{userId || "Unknown"}</span>
            </p>
            {loading || isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <MovieCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-red-500">
                    <p className="text-lg">{error}</p>
                </div>
            ) : (
                watchlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                        <FaListUl className="text-5xl mb-4" />
                        <p className="text-lg">No movies added to your watchlist yet.</p>
                        <p className="text-sm mt-2">Add some movies to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {watchlist.map((movie) => (
                            <MovieCard
                                key={movie.id || movie.movieId}
                                movie={movie}
                                onRemove={handleRemoveMovie}
                                isRemoving={removingMovieId === (movie.id || movie.movieId)}
                                showRemoveIcon
                            />
                        ))}
                    </div>
                )
            )}
            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {isClearModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-transparent backdrop-blur-xl bg-opacity-70 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] rounded-lg shadow-2xl p-8 max-w-sm w-full text-center"
                        >
                            <FaTrash className="text-red-500 text-5xl mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">Clear Watchlist?</h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">This action cannot be undone. All movies will be permanently removed from your watchlist.</p>
                            <div className="flex gap-4 justify-center">
                                <motion.button
                                    onClick={() => setIsClearModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 text-[var(--color-text-secondary)] bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)] cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={confirmClearWatchlist}
                                    className="flex-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                                    whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Confirm Clear
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WatchlistPage;