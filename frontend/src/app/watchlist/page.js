'use client';
import { useEffect, useState } from 'react';
import MovieCard from '../../components/MovieCard';

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('watchlist');
    if (stored) {
      setWatchlist(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Your Watchlist</h1>
      {watchlist.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No movies added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {watchlist.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
