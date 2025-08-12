// src/components/HeroSection.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import TrailerPlayer from '@/components/TrailerPlayer';
import { useTheme } from '@/context/ThemeContext';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

function extractYouTubeId(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]?.split(/[/?#&]/)[0] || null;
      if (u.pathname === '/watch') return u.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

export default function HeroSection() {
  const { isDarkMode } = useTheme();
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Mouse tracking for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useTransform(mouseX, [0, 1], [-20, 20]);
  const parallaxY = useTransform(mouseY, [0, 1], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${serverUrl}/api/trending-picks?language=en-US`);
        if (Array.isArray(data) && data.length > 0) {
          const withBackdrop = data.find(m => m.backdrop_path) || data[0];
          setFeaturedMovie(withBackdrop);
        } else {
          setError('No trending movies found for hero section.');
        }
      } catch (err) {
        console.error('Error fetching featured movie for hero section:', err);
        setError('Failed to load featured movie.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedMovie();
  }, []);

  const trailerKey = useMemo(() => {
    if (!featuredMovie) return null;
    if (featuredMovie.trailerKey) return featuredMovie.trailerKey;
    return extractYouTubeId(featuredMovie.trailerUrl);
  }, [featuredMovie]);

  if (loading) {
    return (
      <div className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-[90vh] xl:min-h-screen overflow-hidden flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        <div className="w-10/12 max-w-5xl z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="space-y-6"
          >
            <div className="h-8 w-3/5 bg-gradient-to-r from-white/20 to-white/5 rounded-xl animate-pulse" />
            <div className="h-16 w-4/5 bg-gradient-to-r from-white/20 to-white/5 rounded-xl animate-pulse" />
            <div className="h-32 bg-gradient-to-r from-white/20 to-white/5 rounded-xl animate-pulse" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error || !featuredMovie) {
    return (
      <div className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-[90vh] xl:min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-red-900/20 to-purple-900/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl md:text-2xl text-red-400 font-medium">
            {error || 'Featured movie not available.'}
          </p>
        </motion.div>
      </div>
    );
  }

  const backdropUrl = featuredMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
    : null;

  const title = featuredMovie.title || featuredMovie.name;
  const mediaType = featuredMovie.media_type || 'movie';
  const year = (featuredMovie.release_date || featuredMovie.first_air_date || '').slice(0, 4) || '—';
  const rating = featuredMovie.vote_average?.toFixed(1) || 'N/A';

  return (
    <section 
      className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-[90vh] xl:min-h-screen overflow-hidden pt-16 md:pt-20"
      onMouseMove={handleMouseMove}
    >
      {/* Custom cursor */}
      <motion.div
        className="fixed w-4 h-4 rounded-full bg-white/60 backdrop-blur-sm border border-white/20 pointer-events-none z-50 mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      {/* Background with advanced parallax and Ken Burns effect */}
      {backdropUrl && (
        <motion.div
          className="absolute inset-0 scale-110"
          style={{
            x: parallaxX,
            y: parallaxY,
          }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ 
            scale: imageLoaded ? [1.1, 1.05, 1.1] : 1.1,
            opacity: imageLoaded ? 1 : 0 
          }}
          transition={{ 
            scale: { duration: 25, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
            opacity: { duration: 1 }
          }}
        >
          <Image
            src={backdropUrl}
            alt={`${title} backdrop`}
            fill
            priority
            className="object-cover"
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </motion.div>
      )}

      {/* Dynamic gradient overlays with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/20" />

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${20 + (i * 5)}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + (i * 0.5),
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="absolute inset-0 z-20">
        <div className="h-full w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8 lg:px-16 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full max-w-4xl"
          >
            {/* Meta badges with glassmorphism */}
            <motion.div 
              className="mb-6 flex flex-wrap gap-3 items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold 
                             bg-white/10 text-white backdrop-blur-md border border-white/20
                             shadow-lg hover:bg-white/20 transition-all duration-300">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                {mediaType.toUpperCase()}
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold
                             bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-200
                             backdrop-blur-md border border-yellow-400/30 shadow-lg">
                ★ {rating}
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold
                             bg-blue-500/20 text-blue-200 backdrop-blur-md border border-blue-400/30
                             shadow-lg">
                {year}
              </span>
            </motion.div>

            {/* Title with text effects */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight md:leading-none mb-4 md:mb-6
                         bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent
                         drop-shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ 
                scale: 1.02,
                textShadow: "0px 0px 20px rgba(255,255,255,0.5)"
              }}
            >
              {title}
            </motion.h1>

            {/* Description with better typography */}
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/85 leading-relaxed max-w-3xl mb-6 md:mb-8
                         font-light tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {featuredMovie.overview?.slice(0, 200)}
              {featuredMovie.overview?.length > 200 && '...'}
            </motion.p>

            {/* Action buttons with advanced effects */}
            <motion.div 
              className="flex flex-wrap gap-4 md:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {/* Play Trailer button */}
              {trailerKey && (
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 25px 50px rgba(255,255,255,0.2)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="group relative overflow-hidden px-8 py-4 rounded-full font-bold text-lg
                           bg-gradient-to-r from-red-600 via-pink-600 to-purple-600
                           text-white shadow-2xl
                           hover:shadow-red-500/50 transition-all duration-300
                           border border-white/20"
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent
                             skew-x-[-20deg]"
                    initial={{ x: '-200%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                  
                  <span className="relative flex items-center gap-3">
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <path d="M8 5v14l11-7z"/>
                    </motion.svg>
                    Watch Trailer
                  </span>
                </motion.button>
              )}

              {/* More Info button */}
              <Link href={`/movie/${featuredMovie.id}?media_type=${mediaType}`}>
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-full font-bold text-lg
                           bg-white/10 backdrop-blur-md text-white
                           border border-white/30 shadow-lg
                           hover:shadow-white/20 transition-all duration-300
                           flex items-center gap-3"
                >
                  More Details
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path d="m9 18 6-6-6-6"/>
                  </motion.svg>
                </motion.button>
              </Link>
            </motion.div>

            {/* Additional movie stats */}
            <motion.div
              className="mt-12 flex flex-wrap gap-8 text-white/60 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {featuredMovie.genre_ids && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-600 rounded" />
                  <span>Genre: {featuredMovie.genre_ids.slice(0, 2).join(', ')}</span>
                </div>
              )}
              {featuredMovie.vote_count && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-green-400 to-blue-600 rounded" />
                  <span>{featuredMovie.vote_count.toLocaleString()} votes</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 text-white/40 scale-90 md:scale-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <motion.div
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            whileHover={{ borderColor: 'rgba(255,255,255,0.6)' }}
          >
            <motion.div
              className="w-1 h-3 bg-white/40 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Trailer Player Modal */}
      <TrailerPlayer
        trailerKey={trailerKey}
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
      />
    </section>
  );
}