// src/components/HeroSection.jsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import TrailerPlayer from '@/components/TrailerPlayer';
import { useTheme } from '@/context/ThemeContext';

export default function HeroSection() {
    const { isDarkMode } = useTheme();
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

    useEffect(() => {
        const fetchFeaturedMovie = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`http://localhost:5000/api/trending-picks?language=en-US`);
                if (data && data.length > 0) {
                    setFeaturedMovie(data[0]);
                } else {
                    setError("No trending movies found for hero section.");
                }
            } catch (err) {
                console.error("Error fetching featured movie for hero section:", err);
                setError("Failed to load featured movie.");
            } finally {
                setLoading(false);
            }
        };
        fetchFeaturedMovie();
    }, []);

    if (loading) {
        return (
            <div className={`w-full h-[500px] flex items-center justify-center
                bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] transition-colors duration-300`}>
                <p>Loading cinematic experience...</p>
            </div>
        );
    }

    if (error || !featuredMovie) {
        return (
            <div className={`w-full h-[500px] flex items-center justify-center
                bg-[var(--color-background-secondary)] text-red-500 transition-colors duration-300`}>
                <p>{error || "Featured movie not available."}</p>
            </div>
        );
    }

    const backdropUrl = featuredMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
        : null;

    const displayTitle = featuredMovie.title || featuredMovie.name;
    const mediaType = featuredMovie.media_type || 'movie';

    return (
        <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[850px] overflow-hidden">
            {/* Background Image */}
            {backdropUrl && (
                <Image
                    src={backdropUrl}
                    alt={`${displayTitle} backdrop`}
                    layout="fill"
                    objectFit="cover"
                    priority
                    className="opacity-40"
                />
            )}
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background-primary)] via-transparent to-transparent opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background-primary)] to-transparent opacity-80"></div>


            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute inset-0 flex flex-col justify-center px-4 md:px-8 lg:px-16 text-white z-10"
            >
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 drop-shadow-lg text-[var(--color-text-primary)]">
                        {displayTitle}
                    </h1>
                    <p className="text-lg md:text-xl mb-6 line-clamp-3 text-[var(--color-text-secondary)] drop-shadow-md">
                        {featuredMovie.overview || "No overview available."}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {featuredMovie.trailerUrl && (
                            <button
                                onClick={() => setIsTrailerModalOpen(true)}
                                className="inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 transform bg-[var(--color-accent)] text-[var(--color-background-primary)] shadow-lg hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background-secondary)] hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-md"
                            >
                                Watch Trailer
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5 ml-2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.97 9.387 11.25 12l4.72 2.613Zm0 0-4.72 2.613L11.25 12l4.72-2.613Z" />
                                </svg>
                            </button>
                        )}
                        <Link href={`/movie/${featuredMovie.id}?media_type=${mediaType}`} passHref>
                            <button
                                className="inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 transform bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] border-2 border-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background-secondary)] hover:scale-105 hover:border-transparent active:scale-95 active:border-transparent"
                            >
                                More Details
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5 ml-2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                            </button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Trailer Player Modal */}
            <TrailerPlayer
                trailerKey={featuredMovie?.trailerUrl ? featuredMovie.trailerUrl.split('v=')[1]?.split('&')[0] : null}
                isOpen={isTrailerModalOpen}
                onClose={() => setIsTrailerModalOpen(false)}
            />
        </div>
    );
}