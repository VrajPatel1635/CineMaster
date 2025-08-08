// src/components/RecommendationsSection.jsx
'use client';
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { FaSpinner } from 'react-icons/fa';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTheme } from '@/context/ThemeContext';
import MovieCard from '@/components/MovieCard';
import MovieCardSkeleton from '@/components/MovieCardSkeleton';

gsap.registerPlugin(ScrollTrigger);

import { useAuth } from '@/context/AuthContext';

export default function RecommendationsSection({ userId }) {
    const { isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const sectionRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setRecommendations([]);
            setLoading(false);
            return;
        }
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            setLoading(false);
            return;
        }
        const fetchRecommendations = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`http://localhost:5000/api/recommendations?userId=${userId}`);
                setRecommendations(data);
            } catch (err) {
                setError("Failed to load recommendations. Please check console for details.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [userId, isAuthenticated]);

    useEffect(() => {
        if (sectionRef.current && !loading && recommendations.length > 0) {
            gsap.fromTo(sectionRef.current,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 85%',
                    },
                }
            );
        }
    }, [loading, recommendations]);

    if (!isAuthenticated) {
        return (
            <div className="text-center text-[var(--color-text-secondary)] py-10">
                <p>You are not logged in. Please log in to see personalized recommendations.</p>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        );
    }
    if (error) {
        return (
            <div className="text-red-500 text-center py-10">
                <p>{error}</p>
            </div>
        );
    }
    if (recommendations.length === 0) {
        return (
            <div className="text-gray-400 text-center py-10">
                <p>No personalized recommendations found yet. Watch some movies to get started!</p>
            </div>
        );
    }
    return (
        <section ref={sectionRef} className="pt-16 pb-10">
            <div className="px-6 space-y-4">
                <h2 className="text-4xl font-bold text-[var(--color-accent)]">Your Personalized Picks</h2>
                <p className={`text-lg italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Based on what you've watched.
                </p>
                <div
                    className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar snap-x snap-mandatory"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {recommendations.map((movie) => (
                        <div className="snap-start min-w-[150px] md:min-w-[200px]" key={movie.id}> {/* Added min-width */}
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

