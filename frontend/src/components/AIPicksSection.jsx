'use client';

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import { X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

import TrailerPlayer from '@/components/TrailerPlayer';

gsap.registerPlugin(ScrollTrigger);

export default function AIPicksSection() {
    const [hollywood, setHollywood] = useState([]);
    const [bollywood, setBollywood] = useState([]);
    const [selectedTrailer, setSelectedTrailer] = useState(null);
    const [loadingHollywood, setLoadingHollywood] = useState(true);
    const [loadingBollywood, setLoadingBollywood] = useState(true);
    const [errorHollywood, setErrorHollywood] = useState(null);
    const [errorBollywood, setErrorBollywood] = useState(null);

    const hollywoodRef = useRef(null);
    const bollywoodRef = useRef(null);

    useEffect(() => {
        fetchTrendingMoviesFromBackend({ language: "en-US" }, setHollywood, setLoadingHollywood, setErrorHollywood);
        fetchTrendingMoviesFromBackend({ language: "en-US", region: "IN", originalLanguage: "hi" }, setBollywood, setLoadingBollywood, setErrorBollywood);
    }, []);

    useEffect(() => {
        const animateSection = (el) => {
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

        if (hollywoodRef.current) animateSection(hollywoodRef.current);
        if (bollywoodRef.current) animateSection(bollywoodRef.current);
    }, [hollywood, bollywood]);

    const fetchTrendingMoviesFromBackend = async (params, setState, setLoading, setError) => {
        setLoading(true);
        setError(null);
        try {
            const queryString = new URLSearchParams(params).toString();
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/trending-picks?${queryString}`);
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
        whileHover: { scale: 1.05, rotate: 1 }
    };

    const Card = ({ movie }) => (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="whileHover"
            className="relative group rounded-xl overflow-hidden shadow-md transform transition-all duration-500 ease-in-out 
                       dark:hover:shadow-[0_0_40px_#E5E5CB] hover:shadow-[0_0_40px_#f9ad5c] hover:rotate-[1deg] cursor-pointer 
                       bg-[#31363F] border border-[#222831] hover:border-transparent"
        >
            <div className="relative z-10">
                <Image
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/images/placeholder-poster.png'}
                    alt={movie.title}
                    width={300}
                    height={450}
                    className="w-full h-[450px] object-cover group-hover:opacity-90 group-hover:blur-[1px] transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-4 text-center transform translate-y-full group-hover:translate-y-0 ease-in-out z-20">
                    <h3 className="text-white text-xl font-semibold mb-2 line-clamp-2 drop-shadow-md">{movie.title}</h3>
                    <p className="text-white text-sm mb-4 line-clamp-3">{movie.overview || "No overview available."}</p>
                    {movie.trailerUrl ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrailer(movie.trailerUrl);
                            }}
                            className="px-6 py-3 bg-[#F0DBDB] hover:bg-[#f0b7b7] dark:bg-[#a17a67] dark:hover:bg-[#4c3b32] rounded-full text-black font-semibold flex items-center space-x-2 transition-colors duration-300 shadow-md cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.97 9.387 11.25 12l4.72 2.613Zm0 0-4.72 2.613L11.25 12l4.72-2.613Z" />
                            </svg>
                            <span>Play Trailer</span>
                        </button>
                    ) : (
                        <p className="text-white text-sm italic">Trailer Not Available</p>
                    )}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="dark:bg-[#1A120B] dark:text-[#D5CEA3] bg-[#FEFCF3] text-[#DBA39A] px-6 py-10 space-y-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-2">🧠 AI Picks For You</h1>
                <p className="text-lg italic">Based on trending genres, user history, or random logic:</p>
                <p className="text-xl mt-1 font-medium">“CineMaster thinks you’ll love this!”</p>
            </div>

            {/* Hollywood Section */}
            <section ref={hollywoodRef}>
                <h2 className="text-3xl font-bold mb-6">Hollywood Trending</h2>
                {loadingHollywood && <p className="text-center text-lg">Loading Hollywood picks...</p>}
                {errorHollywood && <p className="text-center text-lg text-red-500">{errorHollywood}</p>}
                {!loadingHollywood && !errorHollywood && hollywood.length === 0 && (
                    <p className="text-center text-lg text-zinc-400">No Hollywood movies found.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {hollywood.map((movie) => (
                        <Card key={movie.id} movie={movie} />
                    ))}
                </div>
            </section>

            {/* Bollywood Section */}
            <section ref={bollywoodRef}>
                <h2 className="text-3xl font-bold mb-6">Bollywood Trending</h2>
                {loadingBollywood && <p className="text-center text-lg">Loading Bollywood picks...</p>}
                {errorBollywood && <p className="text-center text-lg text-red-500">{errorBollywood}</p>}
                {!loadingBollywood && !errorBollywood && bollywood.length === 0 && (
                    <p className="text-center text-lg text-zinc-400">No Bollywood movies found.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bollywood.map((movie) => (
                        <Card key={movie.id} movie={movie} />
                    ))}
                </div>
            </section>

            <TrailerPlayer
                trailerKey={selectedTrailer ? selectedTrailer.split('https://www.youtube.com/watch?v=')[1] : null}
                isOpen={!!selectedTrailer}
                onClose={() => setSelectedTrailer(null)}
            />
        </div>
    );
}
