// frontend/src/app/watchlist/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import useUser from '../../hooks/useUser';
import MovieCard from '../../components/MovieCard';
import MovieCardSkeleton from '@/components/MovieCardSkeleton';
import { FaSpinner, FaListUl, FaSyncAlt, FaTrash, FaSearch, FaSortAlphaDown, FaClock, FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './watchlist.module.css';

const serverUrl = process.env.NEXT_PUBLIC_API_URL;

const WatchlistPage = () => {
  const { userId, isAuthenticated, isLoading } = useUser();
  const { token } = useAuth();

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingMovieId, setRemovingMovieId] = useState(null);
  const [error, setError] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // UI states
  const [filterTerm, setFilterTerm] = useState('');
  const [sortKey, setSortKey] = useState('addedAt'); // addedAt | title | rating
  const [sortDir, setSortDir] = useState('desc'); // asc | desc

  // Shine reverse toggles
  const [revRefresh, setRevRefresh] = useState(false);
  const [revClear, setRevClear] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchWatchlist = async (id) => {
    if (!id) {
      setLoading(false);
      setWatchlist([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/api/watchlist/${id}`, { headers: authHeaders });
      if (!res.ok) {
        const errorText = await res.text();
        setError('Failed to load your watchlist. Please check the backend server logs.');
        console.error('Failed to fetch watchlist:', res.status, errorText);
        setWatchlist([]);
      } else {
        const data = await res.json();
        setWatchlist(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Network error while fetching watchlist:', err);
      setError('Network error. Could not connect to the server.');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMovie = async (movieId) => {
    if (!userId) return;
    setRemovingMovieId(movieId);
    try {
      const res = await fetch(`${serverUrl}/api/watchlist/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ userId, movieId })
      });
      if (res.ok) {
        await fetchWatchlist(userId);
      } else {
        const errorText = await res.text();
        setError(`Failed to remove movie. Server responded with: ${res.status} ${errorText}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Network error. Could not connect to the server.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setRemovingMovieId(null);
    }
  };

  const handleClearWatchlist = () => setIsClearModalOpen(true);

  const confirmClearWatchlist = async () => {
    setIsClearModalOpen(false);
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/api/watchlist/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setWatchlist([]);
      } else {
        const errorText = await res.text();
        setError('Failed to clear watchlist.');
        console.error('Failed to clear watchlist:', errorText);
      }
    } catch (err) {
      setError('Network error. Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (isAuthenticated && userId) fetchWatchlist(userId);
  };

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setWatchlist([]);
      setLoading(false);
      return;
    }
    if (isAuthenticated && userId && !isLoading) {
      fetchWatchlist(userId);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [userId, isAuthenticated, isLoading]);

  // Derived list: filter + sort
  const displayList = useMemo(() => {
    const q = filterTerm.trim().toLowerCase();
    let arr = [...watchlist];

    if (q) {
      arr = arr.filter(m => {
        const title = (m.title || m.name || '').toLowerCase();
        return title.includes(q);
      });
    }

    arr.sort((a, b) => {
      if (sortKey === 'title') {
        const A = (a.title || a.name || '').toLowerCase();
        const B = (b.title || b.name || '').toLowerCase();
        return sortDir === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      }
      if (sortKey === 'rating') {
        const A = typeof a.vote_average === 'number' ? a.vote_average : -1;
        const B = typeof b.vote_average === 'number' ? b.vote_average : -1;
        return sortDir === 'asc' ? A - B : B - A;
      }
      // addedAt (fallback: by addedAt desc)
      const da = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const db = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return sortDir === 'asc' ? da - db : db - da;
    });

    return arr;
  }, [watchlist, filterTerm, sortKey, sortDir]);

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-xl text-[var(--color-text-secondary)]">
        <p className="font-bold text-2xl mb-4">You are not logged in.</p>
        <p>Please log in to view your watchlist.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.container} pt-24 pb-12`}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroTitleWrap}>
              <h1 className={styles.heroTitle}>Your Watchlist</h1>
              <div className={styles.statsRow}>
                <span className={styles.statChip}>
                  <FaListUl /> {watchlist.length} saved
                </span>
                {loading && <span className={styles.statChip}><FaSpinner className="animate-spin" /> Loading</span>}
                {error && <span className={styles.statChipError}>Error</span>}
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              {/* Filter input */}
              <div className={styles.inputWrap}>
                <FaSearch className={styles.inputIcon} />
                <input
                  placeholder="Filter by title..."
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* Sort chips */}
              <div className={styles.sortRow}>
                <button
                  className={`${styles.chip} ${sortKey === 'addedAt' ? styles.chipActive : ''}`}
                  onClick={() => { setSortKey('addedAt'); setSortDir('desc'); }}
                  title="Sort by Recently Added"
                >
                  <FaClock /> Recent
                </button>
                <button
                  className={`${styles.chip} ${sortKey === 'title' ? styles.chipActive : ''}`}
                  onClick={() => { setSortKey('title'); setSortDir('asc'); }}
                  title="Sort by Title"
                >
                  <FaSortAlphaDown /> Title
                </button>
                <button
                  className={`${styles.chip} ${sortKey === 'rating' ? styles.chipActive : ''}`}
                  onClick={() => { setSortKey('rating'); setSortDir('desc'); }}
                  title="Sort by Rating"
                >
                  <FaStar /> Rating
                </button>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  onClick={handleRefresh}
                  disabled={loading || isLoading}
                  onMouseLeave={() => setRevRefresh(r => !r)}
                  className={`${styles.btn} ${styles.secondary} ${revRefresh ? styles.reverse : ''}`}
                >
                  <span className={styles.shine} />
                  <FaSyncAlt className={loading ? styles.spin : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleClearWatchlist}
                  disabled={loading || isLoading || watchlist.length === 0}
                  onMouseLeave={() => setRevClear(r => !r)}
                  className={`${styles.btn} ${styles.danger} ${revClear ? styles.reverse : ''}`}
                >
                  <span className={styles.shine} />
                  <FaTrash />
                  <span>Clear Watchlist</span>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.heroGlow} />
        </section>

        {/* Content */}
        <section className={styles.content}>
          {loading || isLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className={styles.errorBox}>{error}</div>
          ) : displayList.length === 0 ? (
            <div className={styles.emptyState}>
              <FaListUl className={styles.emptyIcon} />
              <p>No movies found in your watchlist.</p>
              <p className={styles.emptySub}>Add some favorites to get started!</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              className={styles.grid}
            >
              {displayList.map((movie) => (
                <motion.div key={movie.id || movie.movieId} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}>
                  <MovieCard
                    movie={movie}
                    onRemove={handleRemoveMovie}
                    isRemoving={removingMovieId === (movie.id || movie.movieId)}
                    showRemoveIcon
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {isClearModalOpen && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.92, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-title"
            >
              <h3 id="clear-title" className={styles.modalTitle}>Clear Watchlist</h3>
              <p className={styles.modalText}>This action cannot be undone. All movies will be removed from your watchlist.</p>
              <div className={styles.modalActions}>
                <button className={`${styles.btn} ${styles.ghost}`} onClick={() => setIsClearModalOpen(false)}>
                  Cancel
                </button>
                <button className={`${styles.btn} ${styles.danger}`} onClick={confirmClearWatchlist}>
                  <span className={styles.shine} />
                  Confirm Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WatchlistPage;