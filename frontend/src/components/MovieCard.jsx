// frontend/src/components/MovieCard.jsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { FaTrash } from 'react-icons/fa';
import { useEffect, useState, useCallback, useMemo } from 'react';

import WatchlistSuccessPopup from './WatchlistSuccessPopup';
import { useTheme } from '@/context/ThemeContext';

const baseImageUrl = 'https://image.tmdb.org/t/p/w500';
const MotionLink = motion(Link);


export default function MovieCard({ movie, onRemove, isRemoving, showRemoveIcon }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showWatchlistPopup, setShowWatchlistPopup] = useState(false);
  const [watchlistPopupMovie, setWatchlistPopupMovie] = useState(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const title = movie.title || movie.name || 'Untitled';
  const mediaType = (movie.media_type || 'movie').toUpperCase();
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4) || '—';
  const rating = typeof movie.vote_average === 'number' ? Math.round(movie.vote_average * 10) / 10 : null;

  const posterSrc = movie.poster_path ? `${baseImageUrl}${movie.poster_path}` : '/images/placeholder-poster.png';

  // Theme-aware backgrounds
  const cardBg = isDark
    ? 'linear-gradient(135deg, #23272f 60%, #1a2233 100%)'
    : 'linear-gradient(135deg, #f5f7fa 60%, #dbeafe 100%)';
  const glassBg = isDark
    ? 'linear-gradient(180deg, rgba(30,34,44,0.85), rgba(30,34,44,0.65) 85%, transparent)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65) 85%, transparent)';
  const borderCol = isDark
    ? 'rgba(52,152,219,0.18)'
    : 'rgba(52,152,219,0.28)';
  const textPrimary = isDark ? '#fff' : '#1a2233';
  const textSecondary = isDark ? '#cbd5e1' : '#334155';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="group relative w-full max-w-[260px] min-w-[170px] mx-2"
      style={{
        background: cardBg,
        borderRadius: 20,
        padding: 1,
      }}
    >
      {/* Inner glass card */}
      <div
        className="relative rounded-[18px] overflow-hidden shadow-[0_10px_25px_var(--color-shadow-heavy,rgba(0,0,0,0.18))] backdrop-blur-xl transition-transform duration-300"
        style={{
          background: glassBg,
          border: '1px solid',
          borderColor: borderCol,
        }}
      >
        {/* Remove icon */}
        {showRemoveIcon && onRemove && (
          <button
            aria-label="Remove from watchlist"
            className="absolute top-3 left-3 z-30 rounded-full p-2 text-white/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: 'linear-gradient(135deg, rgba(231,76,60,0.9), rgba(192,57,43,0.9))',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
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

        <MotionLink
          href={`/movie/${movie.id}?media_type=${movie.media_type || 'movie'}`}
          className="block"
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        >
          <div className="relative">
            {/* Poster with skeleton shimmer */}
            <div className="relative h-[250px] sm:h-[280px] md:h-[300px] lg:h-[320px] w-full overflow-hidden">
              <Image
                src={posterSrc}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
                className={`object-cover transition duration-700 ease-out will-change-transform ${
                  imgLoaded ? 'scale-100 blur-0' : 'scale-[1.02] blur-[6px]'
                }`}
                onLoadingComplete={() => setImgLoaded(true)}
                priority={false}
              />

              {!imgLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[rgba(255,255,255,0.08)] via-[rgba(255,255,255,0.04)] to-transparent" />
              )}

              {/* Subtle shine on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute -inset-1 bg-[linear-gradient(120deg,rgba(255,255,255,0.15),rgba(255,255,255,0)_40%)] translate-x-[-120%] group-hover:translate-x-[120%] duration-700 ease-out skew-x-[-12deg]" />
              </div>
            </div>

            {/* Gradient overlay for text */}
            <div className={`absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 ${isDark ? 'bg-gradient-to-t from-black/85 via-black/55 to-transparent' : 'bg-gradient-to-t from-white/90 via-white/60 to-transparent'}`} />

            {/* Top-right rating chip */}
            {rating !== null && (
              <div
                className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-full backdrop-blur-md text-white text-xs font-semibold shadow"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
                aria-label={`Rating ${rating} out of 10`}
              >
                <span className="inline-flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {rating}
                </span>
              </div>
            )}

            {/* Hover content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-3 sm:p-4 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-400">
              <h3
                className="text-[0.95rem] sm:text-base font-semibold leading-snug line-clamp-2 drop-shadow-lg"
                style={{ color: textPrimary }}
              >
                {title}
              </h3>

              <div className="mt-1 mb-2 flex items-center gap-2">
                <span
                  className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: isDark
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
                      : 'linear-gradient(180deg, rgba(30,34,44,0.10), rgba(30,34,44,0.04))',
                    border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid #cbd5e1',
                    color: isDark ? '#fff' : '#1a2233',
                  }}
                >
                  {mediaType}
                </span>
                <span
                  className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: isDark
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
                      : 'linear-gradient(180deg, rgba(30,34,44,0.10), rgba(30,34,44,0.04))',
                    border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid #cbd5e1',
                    color: isDark ? '#fff' : '#1a2233',
                  }}
                >
                  {year}
                </span>
              </div>

              <p
                className="text-[11px] sm:text-xs line-clamp-3"
                style={{ color: isDark ? '#f1f5f9' : '#334155' }}
              >
                {movie.overview || 'No overview available.'}
              </p>
            </div>
          </div>
        </MotionLink>

        {/* Bottom info strip (always visible) */}
        <div className="relative p-3 sm:p-3.5">
          <h4
            className="font-semibold text-sm line-clamp-1"
            title={title}
            style={{ color: textPrimary }}
          >
            {title}
          </h4>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: textSecondary }}>
              {year} · {mediaType}
            </span>
            {rating !== null && (
              <span className="text-[11px] font-semibold" style={{ color: textSecondary }}>
                {rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Optional Watchlist Success Popup (kept for your flow) */}
      <WatchlistSuccessPopup
        movie={watchlistPopupMovie}
        show={showWatchlistPopup}
        onClose={() => setShowWatchlistPopup(false)}
      />
    </motion.article>
  );
}