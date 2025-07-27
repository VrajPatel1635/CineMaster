// src/components/MovieCard.jsx
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

const MovieCard = ({ movie }) => {
  const [isHovered, setIsHovered] = useState(false);

  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const posterPath = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/images/placeholder-poster.png';

  const mediaType = movie.media_type || 'movie';

  return (
    <motion.div
      className="group relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/movie/${movie.id}?media_type=${mediaType}`} className="block">
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="
            relative w-full h-80 rounded-lg overflow-hidden shadow-xl
            bg-zinc-800 dark:bg-zinc-900
            cursor-pointer
          "
        >
          <Image
            src={posterPath}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="group-hover:opacity-75 transition-opacity duration-300"
          />

          {/* Hover Tracking Box */}
          {isHovered && (
            <motion.div
              layoutId="card-hover-box"
              className="absolute top-0 left-0 w-full h-full rounded-lg z-30 shadow-[0_0_20px_4px_rgba(34,211,238,0.8)]"
              transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            />
          )}

          {/* Info at bottom */}
          <div
            className="
              absolute bottom-0 left-0 right-0 p-4
              bg-gradient-to-t from-black/80 to-transparent
              text-white z-10
            "
          >
            <h3 className="text-lg font-bold truncate">{title}</h3>
            <p className="text-sm text-zinc-300">{year}</p>
            {movie.vote_average && (
              <div className="flex items-center text-sm mt-1">
                <span className="text-yellow-400 mr-1">★</span>
                {movie.vote_average.toFixed(1)}
              </div>
            )}
          </div>

          {/* Hover Overlay */}
          <motion.div
            initial={{ y: '100%' }}
            animate={isHovered ? { y: 0 } : { y: '100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="
              absolute inset-0 bg-black/80
              flex flex-col justify-center items-center text-center
              text-white p-4
              z-20
            "
          >
            <h3 className="text-xl font-bold mb-2 line-clamp-2">{title}</h3>
            {movie.overview && (
              <p className="text-sm line-clamp-4 mb-4 text-zinc-300">
                {movie.overview}
              </p>
            )}
            <motion.button
              whileHover={{ boxShadow: '0 0 10px 4px #22d3ee', scale: 1.05 }}
              className="
                bg-cyan-500 hover:bg-cyan-600 text-white
                px-4 py-2 rounded-full text-sm font-semibold
                transition-colors duration-200 cursor-pointer
                shadow-md
              "
            >
              View Details
            </motion.button>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default MovieCard;
