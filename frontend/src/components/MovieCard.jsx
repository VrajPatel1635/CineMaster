'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { FaTrash } from 'react-icons/fa';
import { useState } from 'react';
import WatchlistSuccessPopup from './WatchlistSuccessPopup';

const baseImageUrl = 'https://image.tmdb.org/t/p/w500';

const MovieCard = ({ movie, onRemove, isRemoving, showRemoveIcon }) => {
    const [selectedTrailer, setSelectedTrailer] = useState(null);
    const [showWatchlistPopup, setShowWatchlistPopup] = useState(false);
    const [watchlistPopupMovie, setWatchlistPopupMovie] = useState(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            className="relative min-w-[160px] sm:min-w-[180px] md:min-w-[200px] max-w-[240px] mx-2 group cursor-pointer 
                   rounded-2xl overflow-hidden border bg-white/80 dark:bg-zinc-900/40 backdrop-blur-lg 
                   border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-500"
        >
            {/* Remove from Watchlist Icon */}
            {showRemoveIcon && onRemove && (
                <button
                    className="absolute top-2 left-2 z-30 bg-white/80 hover:bg-red-600 hover:text-white text-red-600 rounded-full p-2 shadow-md transition-colors duration-200"
                    title="Remove from Watchlist"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!isRemoving) onRemove(movie.id || movie.movieId);
                    }}
                    disabled={isRemoving}
                >
                    <FaTrash className={isRemoving ? 'animate-spin' : ''} />
                </button>
            )}
            <Link href={`/movie/${movie.id}?media_type=${movie.media_type || 'movie'}`} passHref>
                <div className="relative">
                    {/* Poster */}
                    <Image
                        src={movie.poster_path ? `${baseImageUrl}${movie.poster_path}` : '/images/placeholder-poster.png'}
                        alt={movie.title || movie.name}
                        width={220}
                        height={330}
                        className="w-full h-[250px] sm:h-[280px] md:h-[300px] lg:h-[330px] object-cover rounded-2xl group-hover:scale-[1.02] group-hover:brightness-90 transition-transform duration-500"
                        priority
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 
                                group-hover:opacity-100 transition-opacity duration-500 z-10 rounded-2xl" />

                    {/* Movie Info */}
                    <div className="absolute inset-0 flex flex-col justify-end items-center p-3 text-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 translate-y-6 
                    group-hover:translate-y-0">
                        <h3 className="text-white text-sm sm:text-base font-semibold mb-2 line-clamp-2 drop-shadow-lg">
                            {movie.title || movie.name}
                        </h3>
                        <p className="text-white text-xs sm:text-sm line-clamp-3 mb-3 opacity-80">
                            {movie.overview || "No overview available."}
                        </p>
                        {movie.trailerUrl ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrailer(movie.trailerUrl);
                                }}
                                className="px-4 py-1.5 bg-gradient-to-r from-rose-500 to-fuchsia-600 
                                       hover:from-pink-500 hover:to-violet-600 text-white text-xs font-semibold 
                                       rounded-full shadow-md transition duration-300"
                            >
                                ▶ Watch Trailer
                            </button>
                        ) : (
                            <p className="text-white text-xs italic">No Trailer</p>
                        )}
                    </div>

                    {/* Rating Tooltip */}
                    <div className="absolute top-2 right-2 bg-white dark:bg-zinc-800 text-xs px-2 py-1 rounded-full 
                                shadow-sm opacity-0 group-hover:opacity-100 transition duration-300 z-30">
                        {movie.vote_average && (
                            <span className="flex items-center gap-1 text-yellow-500 font-bold">
                                <Star className="w-4 h-4 fill-yellow-500" />
                                {movie.vote_average.toFixed(1)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Optional Watchlist Success Popup */}
            <WatchlistSuccessPopup
                movie={watchlistPopupMovie}
                show={showWatchlistPopup}
                onClose={() => setShowWatchlistPopup(false)}
            />
        </motion.div>
    );
};

export default MovieCard;
