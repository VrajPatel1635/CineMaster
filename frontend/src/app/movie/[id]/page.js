// src/app/movie/[id]/page.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import TrailerPlayer from '@/components/TrailerPlayer';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function MovieDetailsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [popupMsg, setPopupMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  const contentRef = useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const pathParts = pathname.split('/');
      const id = pathParts[2];
      const mediaType = searchParams.get('media_type');

      if (!id || !mediaType) {
        setError("Missing movie ID or media type in URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://localhost:5000/api/details/${mediaType}/${id}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorData.message || res.statusText}`);
        }

        const data = await res.json();
        setMovieDetails(data);
      } catch (err) {
        console.error("Failed to fetch movie details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 85%',
          },
        }
      );
    }
  }, [movieDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white text-2xl pt-16">
        Loading details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-red-500 text-xl pt-16">
        Error: {error}
      </div>
    );
  }

  if (!movieDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-400 text-xl pt-16">
        No details found.
      </div>
    );
  }

  const displayTitle = movieDetails.title || movieDetails.name;
  const releaseDate = movieDetails.release_date || movieDetails.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const runtime = movieDetails.runtime || (movieDetails.episode_run_time && movieDetails.episode_run_time[0]) || 'N/A';
  const genres = movieDetails.genres?.map(genre => genre.name).join(', ') || 'N/A';

  const backdropPath = movieDetails.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
    : null;
  const posterPath = movieDetails.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
    : '/images/placeholder-poster.png';

  const youtubeTrailerKey = movieDetails.trailerKey;

  // Add to Watchlist handler
  const handleAddToWatchlist = async () => {
    if (!user) {
      // Store intended movie in localStorage and redirect to login
      localStorage.setItem('pendingWatchlistMovie', JSON.stringify({
        id: movieDetails.id,
        media_type: searchParams.get('media_type'),
        movie: movieDetails
      }));
      router.push('/login');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('http://localhost:5000/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          movieId: movieDetails.id,
          mediaType: searchParams.get('media_type'),
          movie: movieDetails,
        }),
      });
      if (!res.ok) throw new Error('Failed to add to watchlist');
      setPopupMsg(`${movieDetails.title || movieDetails.name} added to watchlist!`);
      setTimeout(() => setPopupMsg(''), 2000);
    } catch (err) {
      setPopupMsg('Error adding to watchlist');
      setTimeout(() => setPopupMsg(''), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pt-16">
      {backdropPath && (
        <div className="relative w-full h-[800px] bg-black z-0">
          <Image
            src={backdropPath}
            alt={`${displayTitle} backdrop`}
            layout="fill"
            objectFit="cover"
            priority
            className="opacity-40 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
        </div>
      )}

      <motion.div
        ref={contentRef}
        className={`relative ${backdropPath ? '-mt-20' : 'pt-8'} z-10 max-w-5xl mx-auto px-4 pb-16`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 h-80 md:h-96 w-48 md:w-64 rounded-lg overflow-hidden shadow-xl">
            <Image
              src={posterPath}
              alt={`${displayTitle} poster`}
              width={500}
              height={750}
              layout="responsive"
              className="rounded-lg"
            />
          </div>

          <div className="flex-grow">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{displayTitle}</h1>
            <p className="text-zinc-300 text-lg mb-2">
              {year} • {genres} • {runtime} min
            </p>
            {movieDetails.tagline && (
              <p className="text-zinc-400 italic mb-4 text-xl">"{movieDetails.tagline}"</p>
            )}
            <p className="text-lg leading-relaxed mb-6">{movieDetails.overview}</p>

            {movieDetails.vote_average && (
              <div className="flex items-center text-xl font-bold mb-4">
                <span className="text-yellow-400 mr-2">★</span>
                {movieDetails.vote_average.toFixed(1)} / 10
                <span className="text-zinc-400 text-sm ml-2">({movieDetails.vote_count} votes)</span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-4">
              {movieDetails.homepage && (
                <a
                  href={movieDetails.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-[0_0_20px_#6366F1]"
                >
                  Visit Homepage
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </a>
              )}

              {youtubeTrailerKey && (
                <button
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-[0_0_20px_#EF4444]"
                >
                  Watch Trailer
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.97 9.387 11.25 12l4.72 2.613Zm0 0-4.72 2.613L11.25 12l4.72-2.613Z" />
                  </svg>
                </button>
              )}

              {/* Add to Watchlist Button */}
              <button
                onClick={handleAddToWatchlist}
                disabled={adding}
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-[0_0_20px_#22C55E] disabled:opacity-60"
              >
                {adding ? 'Adding...' : 'Add to Watchlist'}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            {/* Popup message */}
            {popupMsg && (
              <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-6 py-3 rounded-full shadow-lg z-50 text-lg animate-bounce">
                {popupMsg}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <TrailerPlayer
        trailerKey={youtubeTrailerKey}
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
      />
    </div>
  );
}
