// src/app/movie/[id]/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { notFound, useSearchParams, useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import TrailerPlayer from '@/components/TrailerPlayer';
import WatchlistSuccessPopup from '@/components/WatchlistSuccessPopup';
import { useAuth } from '@/context/AuthContext';
import styles from './movie.module.css';

const serverUrl = process.env.NEXT_PUBLIC_API_URL;

/* Framer variants */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
};

/* Rating ring component (0..10) */
function RatingRing({ value = 0, size = 64, stroke = 6 }) {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const pct = Math.max(0, Math.min(100, (value / 10) * 100));
    const dash = (pct / 100) * circ;

    const color =
        value >= 7 ? 'var(--color-success, #2ecc71)'
            : value >= 5 ? 'var(--color-warning, #f1c40f)'
                : 'var(--color-error, #e74c3c)';

    return (
        <div className={styles.ringWrap} style={{ width: size, height: size }}>
            <svg width={size} height={size} className={styles.ringSvg}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={stroke}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeLinecap="round"
                    className={styles.ringProgress}
                />
            </svg>
            <div className={styles.ringValue}>
                <span>{value ? value.toFixed(1) : 'N/A'}</span>
            </div>
        </div>
    );
}

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
    const [revTrailer, setRevTrailer] = useState(false);
    const [revWatchlist, setRevWatchlist] = useState(false);

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
                } catch (err) {
                    console.error('Failed to save movie to history:', err);
                }
            };
            saveToHistory();
        }
    }, [isAuthenticated, movieDetails, user]);

    const handleAddToWatchlist = async () => {
        if (!isAuthenticated || isAdding) return;
        setIsAdding(true);
        setWatchlistError(null);

        const moviePayload = {
            userId: user._id,
            movieId: movieDetails?.id,
            title: movieDetails?.title || movieDetails?.name,
            genreIds: movieDetails?.genres?.map(g => g.id) || []
        };

        try {
            const res = await axios.post(`${serverUrl}/api/watchlist/add`, moviePayload);
            if (res.status === 200) {
                setIsAdded(true);
                setWatchlistPopupMovie(movieDetails);
                setShowWatchlistPopup(true);
                setTimeout(() => setShowWatchlistPopup(false), 4000);
            }
        } catch (error) {
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

    const handleRemoveFromWatchlist = async () => {
        if (!isAuthenticated || isAdding) return;
        setIsAdding(true);
        setWatchlistError(null);
        try {
            const res = await axios.post(`${serverUrl}/api/watchlist/remove`, {
                userId: user._id,
                movieId: movieDetails.id,
            });
            if (res.status === 200) setIsAdded(false);
        } catch (error) {
            console.error("Error removing movie from watchlist:", error);
            setWatchlistError('Failed to remove movie from watchlist.');
        } finally {
            setIsAdding(false);
        }
    };

    const backdropUrl = movieDetails?.backdrop_path ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}` : null;
    const posterUrl = movieDetails?.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : '/images/placeholder-poster.png';

    const score = useMemo(() => (typeof movieDetails?.vote_average === 'number' ? movieDetails.vote_average : 0), [movieDetails]);

    if (loading) {
        return (
            <div className={styles.pageWrap}>
                <div className={styles.hero}>
                    <div className={styles.backdropSkeleton} />
                    <div className={styles.contentWrap}>
                        <div className={styles.posterSkeleton} />
                        <div className={styles.textSkeleton}>
                            <div className={styles.line} />
                            <div className={styles.line} />
                            <div className={styles.lineSm} />
                            <div className={styles.line} />
                            <div className={styles.lineSm} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="min-h-[60vh] flex items-center justify-center text-red-500">{error}</div>;
    }

    if (!movieDetails) {
        return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Movie not found.</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className={styles.pageWrap}
        >
            {/* Backdrop */}
            <div className={styles.backdropWrap}>
                {backdropUrl && (
                    <Image
                        src={backdropUrl}
                        alt={`${movieDetails.title || movieDetails.name} backdrop`}
                        fill
                        priority
                        className={styles.backdrop}
                        sizes="100vw"
                    />
                )}
                <div className={styles.backdropTint} />
                <div className={styles.vignette} />
            </div>

            <div className={styles.hero}>
                {/* Poster */}
                <motion.div
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className={styles.posterFrame}
                >
                    <div className={styles.posterInner}>
                        <Image
                            src={posterUrl}
                            alt={movieDetails.title || movieDetails.name}
                            width={360}
                            height={540}
                            className={styles.posterImg}
                            priority
                        />
                    </div>
                    {/* Score ring overlays the poster frame at small screens */}
                    <div className={styles.posterScoreMobile}>
                        <RatingRing value={score} size={64} stroke={6} />
                    </div>
                </motion.div>

                {/* Content panel */}
                <div className={styles.contentWrap}>
                    <motion.h1
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className={styles.title}
                    >
                        {movieDetails.title || movieDetails.name}
                    </motion.h1>

                    {movieDetails.tagline && (
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={styles.tagline}
                        >
                            {movieDetails.tagline}
                        </motion.p>
                    )}

                    {/* Meta row */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.25 }}
                        className={styles.metaRow}
                    >
                        <div className={styles.metaChip}>
                            <RatingRing value={score} size={72} stroke={6} />
                            <span>User score</span>
                        </div>

                        <span className={styles.dot} />

                        <div className={styles.metaItem}>
                            <span>Released</span>
                            <strong>{movieDetails.release_date || movieDetails.first_air_date || 'N/A'}</strong>
                        </div>

                        <span className={styles.dot} />

                        <div className={styles.metaItem}>
                            <span>Runtime</span>
                            <strong>
                                {movieDetails.runtime
                                    ? `${movieDetails.runtime} min`
                                    : movieDetails.episode_run_time?.[0]
                                        ? `${movieDetails.episode_run_time[0]} min`
                                        : 'N/A'}
                            </strong>
                        </div>

                        <span className={styles.dot} />

                        <div className={styles.metaItem}>
                            <span>Type</span>
                            <strong>{(searchParams.get('media_type') || 'movie').toUpperCase()}</strong>
                        </div>
                    </motion.div>

                    {/* Overview */}
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.3 }}
                        className={styles.overview}
                    >
                        {movieDetails.overview || 'No overview available.'}
                    </motion.p>

                    {/* Genres */}
                    <motion.div
                        className={styles.genres}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {(movieDetails.genres || []).map((genre) => (
                            <motion.span
                                key={genre.id}
                                variants={itemVariants}
                                whileHover={{ y: -3, scale: 1.06 }}
                                className={styles.genreChip}
                            >
                                {genre.name}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.35 }}
                        className={styles.ctaRow}
                    >
                        {movieDetails.trailerKey && (
                            <button
                                onClick={() => setIsTrailerModalOpen(true)}
                                onMouseLeave={() => setRevTrailer(r => !r)}
                                className={`${styles.ctaShine} ${styles.primary} ${revTrailer ? styles.reverse : ''}`}
                                aria-label="Watch trailer"
                            >
                                <span className={styles.ctaShineSweep} />
                                ▶ Watch Trailer
                            </button>
                        )}

                        {isAuthenticated && (
                            <button
                                onClick={isAdded ? handleRemoveFromWatchlist : handleAddToWatchlist}
                                disabled={isAdding}
                                onMouseLeave={() => setRevWatchlist(r => !r)}
                                className={`${styles.ctaShine} ${isAdded ? styles.success : styles.secondary} ${isAdding ? styles.disabled : ''} ${revWatchlist ? styles.reverse : ''}`}
                                aria-live="polite"
                            >
                                <span className={styles.ctaShineSweep} />
                                {isAdding ? 'Working...' : isAdded ? (<><FaHeart className={styles.icon} /> Remove from Watchlist</>) : (<><FaRegHeart className={styles.icon} /> Add to Watchlist</>)}
                            </button>
                        )}
                    </motion.div>

                    <AnimatePresence>
                        {watchlistError && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.25 }}
                                className={styles.errorText}
                            >
                                {watchlistError}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <TrailerPlayer
                trailerKey={movieDetails.trailerKey}
                isOpen={isTrailerModalOpen}
                onClose={() => setIsTrailerModalOpen(false)}
            />
            <WatchlistSuccessPopup
                movie={watchlistPopupMovie}
                show={showWatchlistPopup}
                onClose={() => setShowWatchlistPopup(false)}
            />
        </motion.div>
    );
}