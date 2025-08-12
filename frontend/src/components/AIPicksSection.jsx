// src/components/AIPicksSection.jsx
'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import Link from 'next/link';
import gsap from 'gsap';
import { Star } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

gsap.registerPlugin(ScrollTrigger);

export default function AIPicksSection() {
    const { isDarkMode } = useTheme();
    const MotionLink = motion(Link);

    const [hollywood, setHollywood] = useState([]);
    const [bollywood, setBollywood] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [topRatedMovies, setTopRatedMovies] = useState([]);

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



    return (
        <div className="px-6 py-10 space-y-16 bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
            {/* Hollywood Section */}
            <section ref={hollywoodRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Hollywood Trending</h2>
                {loadingHollywood && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                    </div>
                )}
                {errorHollywood && <p className="text-center text-lg text-red-500">{errorHollywood}</p>}
                {!loadingHollywood && !errorHollywood && hollywood.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No Hollywood movies found.</p>
                )}
                <div className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-3 sm:pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
                >
                    {hollywood.map((movie) => (
                        <div
                            key={movie.id}
                            className="snap-center flex-shrink-0 min-w-[130px] xs:min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]"
                        >
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Bollywood Section */}
            <section ref={bollywoodRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Bollywood Trending</h2>
                {loadingBollywood && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                    </div>
                )}
                {errorBollywood && <p className="text-center text-lg text-red-500">{errorBollywood}</p>}
                {!loadingBollywood && !errorBollywood && bollywood.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No Bollywood movies found.</p>
                )}
                <div className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-3 sm:pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
                >
                    {bollywood.map((movie) => (
                        <div
                            key={movie.id}
                            className="snap-center flex-shrink-0 min-w-[130px] xs:min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]"
                        >
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Popular Movies Section */}
            <section ref={popularRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Popular Movies</h2>
                {loadingPopular && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                    </div>
                )}
                {errorPopular && <p className="text-center text-lg text-red-500">{errorPopular}</p>}
                {!loadingPopular && !errorPopular && popularMovies.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No popular movies found.</p>
                )}
                <div className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-3 sm:pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
                >
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="snap-center flex-shrink-0 min-w-[130px] xs:min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]"
                        >
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Top Rated Movies Section */}
            <section ref={topRatedRef}>
                <h2 className="text-3xl font-bold mb-4 text-[var(--color-accent)]">Top Rated Movies</h2>
                {loadingTopRated && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                    </div>
                )}
                {errorTopRated && <p className="text-center text-lg text-red-500">{errorTopRated}</p>}
                {!loadingTopRated && !errorTopRated && topRatedMovies.length === 0 && (
                    <p className={`text-center text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>No top rated movies found.</p>
                )}
                <div className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-3 sm:pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
                >
                    {topRatedMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="snap-center flex-shrink-0 min-w-[130px] xs:min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]"
                        >
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}