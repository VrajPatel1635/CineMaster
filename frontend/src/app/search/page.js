'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from '@/components/MovieCard';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10,
    },
  },
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorData.message || res.statusText}`);
        }

        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-[#FEFCF3] dark:bg-[#1A120B] dark:text-[#D5CEA3] text-[#DBA39A] pt-20 px-4 md:px-8 lg:px-12"
    >
      <motion.h1
        variants={itemVariants}
        className="text-3xl md:text-4xl font-bold mb-8 text-center"
      >
        Search Results for &quot;{query || ''}&quot;
      </motion.h1>

      {loading && (
        <motion.div
          variants={itemVariants}
          className="text-center text-xl text-indigo-400"
        >
          Loading search results...
        </motion.div>
      )}

      {error && (
        <motion.div
          variants={itemVariants}
          className="text-center text-xl text-red-500"
        >
          Error: {error}
        </motion.div>
      )}

      {!loading && !error && results.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center text-xl text-zinc-400"
        >
          No results found for &quot;{query}&quot;.
        </motion.div>
      )}

      {!loading && !error && results.length > 0 && (
        <motion.div
          variants={containerVariants}
          className="
            grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6
            max-w-7xl mx-auto
          "
        >
          {results.map((movie, index) => (
            (movie.id && (movie.title || movie.name)) && (
              <motion.div key={movie.id} variants={itemVariants}>
                <MovieCard movie={movie} />
              </motion.div>
            )
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-900 dark:bg-black text-white pt-20 px-4 flex items-center justify-center text-xl">
          Loading search page...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
