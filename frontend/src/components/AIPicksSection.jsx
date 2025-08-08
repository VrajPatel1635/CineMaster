// src/components/AIPicksSection.jsx 
'use client';

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import Link from 'next/link';
import gsap from 'gsap';
import { Star } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import TrailerPlayer from '@/components/TrailerPlayer';
import { useTheme } from '@/context/ThemeContext';
import MovieCardSkeleton from "./MovieCardSkeleton";

gsap.registerPlugin(ScrollTrigger);

export default function AIPicksSection() {
    const { isDarkMode } = useTheme();

    const [hollywood, setHollywood] = useState([]);
    const [bollywood, setBollywood] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [topRatedMovies, setTopRatedMovies] = useState([]);

    const [selectedTrailer, setSelectedTrailer] = useState(null);

    const [loadingHollywood, setLoadingHollywood] = useState(true);
    const [loadingBollywood, setLoadingBollywood] = useState(true);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingTopRated, setLoadingTopRated] = useState(true);
    const [errorHollywood, setErrorHollywood] = useState(null);
    const [errorBollywood, setErrorBollywood] = useState(null);
    const [errorPopular, setErrorPopular] = useState(null);
    const [errorTopRated, setErrorTopRated] = useState(null);

    const hollywoodRef = useRef(null);
    const bollywoodRef = useRef(null);
    const popularRef = useRef(null);
    const topRatedRef = useRef(null);

    useEffect(() => {
        const fetchAllMovies = async () => {
            await Promise.all([
                fetchTrendingMoviesFromBackend({ language: "en-US" }, setHollywood, setLoadingHollywood, setErrorHollywood),
                fetchTrendingMoviesFromBackend({ language: "en-US", region: "IN", originalLanguage: "hi" }, setBollywood, setLoadingBollywood, setErrorBollywood),
                fetchMoviesFromBackend('/api/popular-movies', setPopularMovies, setLoadingPopular, setErrorPopular),
                fetchMoviesFromBackend('/api/top-rated-movies', setTopRatedMovies, setLoadingTopRated, setErrorTopRated),
            ]);
        };
        fetchAllMovies();
    }, []);

    useEffect(() => {
        const animateSection = (el) => {
            if (!el) return;
            gsap.fromTo(el,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        // markers: true, // Uncomment for debugging scroll trigger
                    },
                }
            );
        };

        if (hollywoodRef.current && !loadingHollywood) animateSection(hollywoodRef.current);
        if (bollywoodRef.current && !loadingBollywood) animateSection(bollywoodRef.current);
        if (popularRef.current && !loadingPopular) animateSection(popularRef.current);
        if (topRatedRef.current && !loadingTopRated) animateSection(topRatedRef.current);
    }, [hollywood, bollywood, popularMovies, topRatedMovies, loadingHollywood, loadingBollywood, loadingPopular, loadingTopRated]);

    const fetchMoviesFromBackend = async (endpoint, setState, setLoading, setError) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`http://localhost:5000${endpoint}`);
            setState(data);
        } catch (error) {
            console.error(`Error fetching movies from backend (${endpoint}):`, error);
            setError("Failed to load movies. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingMoviesFromBackend = async (params, setState, setLoading, setError) => {
        setLoading(true);
        setError(null);
        try {
            const queryString = new URLSearchParams(params).toString();
            const { data } = await axios.get(`http://localhost:5000/api/trending-picks?${queryString}`);
            setState(data);
        } catch (error) {
            console.error(`Error fetching trending movies from backend:`, error);
            setError("Failed to load movies. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
        whileHover: { scale: 1.05 }
    };

    const Card = ({ movie }) => (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="whileHover"
            className="relative min-w-[160px] sm:min-w-[180px] md:min-w-[200px] max-w-[240px] mx-2 group cursor-pointer 
                   rounded-2xl overflow-hidden border bg-white/80 dark:bg-zinc-900/40 backdrop-blur-lg 
                   border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-xl hover:scale-[1.03] 
                   transition-all duration-500"
        >
            <Link href={`/movie/${movie.id}?media_type=${movie.media_type || 'movie'}`} passHref>
                <div className="relative">
                    {/* Poster */}
                    <Image
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/images/placeholder-poster.png'}
                        alt={movie.title || movie.name}
                        width={220}
                        height={330}
                        className="w-full h-[250px] sm:h-[280px] md:h-[300px] lg:h-[330px] object-cover rounded-2xl 
                               group-hover:scale-[1.02] group-hover:brightness-90 transition-transform duration-500"
                        priority
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 
                                group-hover:opacity-100 transition-opacity duration-500 z-10 rounded-2xl" />

                    {/* Movie Info */}
                    <div className="absolute inset-0 flex flex-col justify-end items-center p-3 text-center opacity-0 
                                group-hover:opacity-100 transition-all duration-500 z-20 translate-y-6 
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

                    {/* Tooltip / Hover Preview */}
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
        </motion.div>
    );

    return (
        <div className={`px-6 py-10 space-y-16
            bg-[var(--color-background-primary)] text-[var(--color-text-primary)]`}>
            {/* Hollywood Section */}
            <section ref={hollywoodRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Hollywood Trending</h2>
                {loadingHollywood && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {errorHollywood && <p className="text-center text-lg text-red-500">{errorHollywood}</p>}
                {!loadingHollywood && !errorHollywood && hollywood.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No Hollywood movies found.</p>
                )}
                <div
                    className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar snap-x snap-mandatory "
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {hollywood.map((movie) => (
                        <div className="snap-start" key={movie.id}>
                            <Card movie={movie} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Bollywood Section */}
            <section ref={bollywoodRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Bollywood Trending</h2>
                {loadingBollywood && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {errorBollywood && <p className="text-center text-lg text-red-500">{errorBollywood}</p>}
                {!loadingBollywood && !errorBollywood && bollywood.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No Bollywood movies found.</p>
                )}
                <div
                    className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {bollywood.map((movie) => (
                        <div className="snap-start" key={movie.id}>
                            <Card movie={movie} />
                        </div>
                    ))}
                </div>
            </section>

            {/* NEW: Popular Movies Section */}
            <section ref={popularRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Popular Movies</h2>
                {loadingPopular && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {errorPopular && <p className="text-center text-lg text-red-500">{errorPopular}</p>}
                {!loadingPopular && !errorPopular && popularMovies.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No popular movies found.</p>
                )}
                <div
                    className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {popularMovies.map((movie) => (
                        <div className="snap-start" key={movie.id}>
                            <Card movie={movie} />
                        </div>
                    ))}
                </div>
            </section>

            {/* NEW: Top Rated Movies Section */}
            <section ref={topRatedRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Top Rated Movies</h2>
                {loadingTopRated && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {errorTopRated && <p className="text-center text-lg text-red-500">{errorTopRated}</p>}
                {!loadingTopRated && !errorTopRated && topRatedMovies.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No top rated movies found.</p>
                )}
                <div
                    className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {topRatedMovies.map((movie) => (
                        <div className="snap-start" key={movie.id}>
                            <Card movie={movie} />
                        </div>
                    ))}
                </div>
            </section>


            {/* Trailer Popup */}
            <TrailerPlayer
                trailerKey={selectedTrailer ? selectedTrailer.split('v=')[1]?.split('&')[0] : null}
                isOpen={!!selectedTrailer}
                onClose={() => setSelectedTrailer(null)}
            />
        </div>
    );
}