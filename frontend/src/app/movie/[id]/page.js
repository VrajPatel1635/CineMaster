// src/app/movie/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { notFound, useSearchParams, useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import TrailerPlayer from '@/components/TrailerPlayer';
import WatchlistSuccessPopup from '@/components/WatchlistSuccessPopup';
import { useAuth } from '@/context/AuthContext';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

// Define variants for the staggered genre animation
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function MovieDetails() {
    const params = useParams();
    const { id } = params;
    const searchParams = useSearchParams();
    const mediaType = searchParams.get('media_type') || 'movie';

    const { user, isAuthenticated } = useAuth();

    const [movieDetails, setMovieDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
    const [showWatchlistPopup, setShowWatchlistPopup] = useState(false);
    const [watchlistPopupMovie, setWatchlistPopupMovie] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [watchlistError, setWatchlistError] = useState(null);

    // Fetch movie details and check watchlist status
    useEffect(() => {
        if (!id) return;

        const fetchDetailsAndStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const detailsResponse = await axios.get(`${serverUrl}/api/details/${mediaType}/${id}`);
                setMovieDetails(detailsResponse.data);

                if (isAuthenticated && user) {
                    const statusResponse = await axios.get(`${serverUrl}/api/watchlist/status/${user._id}/${detailsResponse.data.id}`);
                    setIsAdded(statusResponse.data.inWatchlist);
                }
            } catch (err) {
                console.error('Error fetching movie details or watchlist status:', err);
                if (err.response && err.response.status === 404) {
                    notFound();
                } else {
                    setError('Failed to fetch movie details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDetailsAndStatus();
    }, [id, mediaType, isAuthenticated, user]);

    // Save to history effect is fine as is
    useEffect(() => {
        if (isAuthenticated && movieDetails && user) {
            const saveToHistory = async () => {
                try {
                    const genreIds = movieDetails.genres ? movieDetails.genres.map(g => g.id) : [];
                    await axios.post(`${serverUrl}/api/save-history`, {
                        userId: user._id,
                        movieId: movieDetails.id,
                        genreIds,
                        title: movieDetails.title || movieDetails.name,
                    });
                    console.log(`Movie ID ${movieDetails.id} saved to history for user ${user._id}.`);
                } catch (err) {
                    console.error('Failed to save movie to history:', err);
                }
            };
            saveToHistory();
        }
    }, [isAuthenticated, movieDetails, user]);

    // Function to handle adding a movie to the watchlist
    const handleAddToWatchlist = async () => {
        if (!isAuthenticated || isAdding) {
            if (!isAuthenticated) console.log("User not authenticated, please login to add to watchlist.");
            return;
        }

        setIsAdding(true);
        setWatchlistError(null);

        const moviePayload = {
            userId: user._id,
            movieId: movieDetails?.id,
            title: movieDetails?.title || movieDetails?.name,
            genreIds: movieDetails?.genres?.map(g => g.id) || []
        };

        // --- ENHANCED DEBUGGING: INSPECT THE PAYLOAD AND RESPONSE ---
        console.groupCollapsed(`Attempting to add movie to watchlist...`);
        console.log("Movie ID:", moviePayload.movieId);
        console.log("Title:", moviePayload.title);
        console.log("Genre IDs:", moviePayload.genreIds)
        console.groupEnd();

        try {
            const res = await axios.post(`${serverUrl}/api/watchlist/add`, moviePayload);

            // Log the successful response from the server
            console.log("SUCCESS: Watchlist API responded with:", res.data);

            if (res.status === 200) {
                setIsAdded(true);
                setWatchlistPopupMovie(movieDetails);
                setShowWatchlistPopup(true);
                setTimeout(() => setShowWatchlistPopup(false), 5000);
            }
        } catch (error) {
            // Log the full error object for detailed inspection
            console.error("ERROR: Failed to add movie to watchlist. Full error object:", error);

            if (error.response && error.response.status === 409) {
                setWatchlistError('This movie is already in your watchlist.');
                setIsAdded(true);
            } else {
                setWatchlistError('Failed to add movie to watchlist. Please try again.');
            }
        } finally {
            setIsAdding(false);
        }
    };

    // Function to handle removing a movie from the watchlist
    const handleRemoveFromWatchlist = async () => {
        if (!isAuthenticated || isAdding) {
            if (!isAuthenticated) console.log("User not authenticated, please login to remove from watchlist.");
            return;
        }
        setIsAdding(true);
        setWatchlistError(null);

        try {
            const res = await axios.post(`${serverUrl}/api/watchlist/remove`, {
                userId: user._id,
                movieId: movieDetails.id,
            });
            if (res.status === 200) {
                console.log(res.data.message);
                setIsAdded(false);
            }
        } catch (error) {
            console.error("Error removing movie from watchlist:", error);
            setWatchlistError('Failed to remove movie from watchlist.');
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center text-gray-300">Loading details...</div>;
    }

    if (error) {
        return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    if (!movieDetails) {
        return <div className="h-screen flex items-center justify-center text-gray-300">Movie not found.</div>;
    }

    const backdropUrl = movieDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}` : null;
    const posterUrl = movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : '/images/placeholder-poster.png';

    const renderTrailerButton = () => {
        if (movieDetails.trailerKey) {
            return (
                <motion.button
                    whileHover={{
                        scale: 1.05,
                        y: -3,
                        boxShadow: "0 10px 20px rgba(52, 211, 153, 0.6)",
                    }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    onClick={() => setIsTrailerModalOpen(true)}
                    className="relative flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 transform shadow-lg text-white bg-gradient-to-r from-green-500 to-teal-500 group overflow-hidden cursor-pointer"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600 to-teal-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
                    <span className="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.97 9.387 11.25 12l4.72 2.613Zm0 0-4.72 2.613L11.25 12l4.72-2.613Z" />
                        </svg>
                        Watch Trailer
                    </span>
                </motion.button>
            );
        }
        return null;
    };

    const renderWatchlistButton = () => {
        if (isAuthenticated) {
            return (
                <motion.button
                    whileHover={{
                        scale: 1.05,
                        y: -2,
                        boxShadow: isAdded
                            ? "0 0 20px rgba(34, 197, 94, 0.8)"
                            : "0 0 20px rgba(147, 51, 234, 0.8)"
                    }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    onClick={isAdded ? handleRemoveFromWatchlist : handleAddToWatchlist}
                    disabled={isAdding}
                    className={`relative flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg group overflow-hidden cursor-pointer
                        ${isAdded
                            ? 'bg-gradient-to-r from-green-500 to-green-700 text-white'
                            : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'}
                        ${isAdding && 'opacity-50 cursor-not-allowed'}`}
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-800 to-purple-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
                    <span className="relative z-10 flex items-center">
                        {isAdding ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isAdded ? (
                            <FaHeart className="w-5 h-5 mr-2" />
                        ) : (
                            <FaRegHeart className="w-5 h-5 mr-2" />
                        )}
                        {isAdding ? 'Adding...' : isAdded ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </span>
                </motion.button>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-screen pt-16 bg-[var(--color-background-primary)] text-[var(--color-text-primary)] transition-colors duration-300"
        >
            {backdropUrl && (
                <div className="absolute inset-0 z-0 opacity-20">
                    <Image
                        src={backdropUrl}
                        alt={`${movieDetails.title || movieDetails.name} backdrop`}
                        layout="fill"
                        objectFit="cover"
                        priority
                    />
                </div>
            )}
            <div className="relative z-10 px-4 md:px-8 lg:px-16 py-10">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-shrink-0 w-full md:w-[300px] h-[450px] md:h-[450px] rounded-lg overflow-hidden shadow-2xl"
                    >
                        <Image
                            src={posterUrl}
                            alt={movieDetails.title || movieDetails.name}
                            width={300}
                            height={450}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </motion.div>
                    <div className="flex-grow">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4"
                        >
                            {movieDetails.title || movieDetails.name}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-lg md:text-xl italic mb-4 text-[var(--color-accent)]"
                        >
                            {movieDetails.tagline}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex items-center space-x-4 mb-6 text-sm md:text-base text-[var(--color-text-secondary)]"
                        >
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A'} / 10
                            </span>
                            <span>|</span>
                            <span>{movieDetails.release_date || movieDetails.first_air_date || 'N/A'}</span>
                            <span>|</span>
                            <span>{movieDetails.runtime ? `${movieDetails.runtime} min` : (movieDetails.episode_run_time && movieDetails.episode_run_time[0]) ? `${movieDetails.episode_run_time[0]} min` : 'N/A'}</span>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="text-base leading-relaxed mb-6"
                        >
                            {movieDetails.overview || 'No overview available.'}
                        </motion.p>
                        <motion.div
                            className="flex flex-wrap gap-2 mb-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {movieDetails.genres && movieDetails.genres.map((genre) => (
                                <motion.span
                                    key={genre.id}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.1, y: -5, backgroundColor: '#a855f7', color: '#111827', borderColor: '#c084fc' }}
                                    transition={{ duration: 0.2 }}
                                    className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] border border-[var(--color-accent)] cursor-pointer"
                                >
                                    {genre.name}
                                </motion.span>
                            ))}
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="flex items-center gap-4"
                        >
                            {renderTrailerButton()}
                            {renderWatchlistButton()}
                        </motion.div>
                        {watchlistError && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 text-sm text-red-400"
                            >
                                {watchlistError}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <TrailerPlayer
                trailerKey={movieDetails.trailerKey}
                isOpen={isTrailerModalOpen}
                onClose={() => setIsTrailerModalOpen(false)}
            />
            <WatchlistSuccessPopup movie={watchlistPopupMovie} show={showWatchlistPopup} onClose={() => setShowWatchlistPopup(false)} />
        </motion.div>
    );
}