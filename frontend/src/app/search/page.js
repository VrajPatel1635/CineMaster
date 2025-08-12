// frontend/src/app/search/page.js
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from '@/components/MovieCard';
import MovieCardSkeleton from '@/components/MovieCardSkeleton';
import styles from './search.module.css';

// Animations
const containerVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, when: 'beforeChildren', staggerChildren: 0.06, delayChildren: 0.15 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
};

const serverUrl = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE_FALLBACK = 24;

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

// Simple, battle-tested pagination window with ellipses
function getPageItems({ current, total, siblingCount = 1 }) {
  const totalPageNumbers = siblingCount * 2 + 5; 
  if (total <= totalPageNumbers) return range(1, total);

  const leftSiblingIndex = Math.max(current - siblingCount, 1);
  const rightSiblingIndex = Math.min(current + siblingCount, total);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = range(1, leftItemCount);
    return [...leftRange, 'dots', total];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = range(total - rightItemCount + 1, total);
    return [1, 'dots', ...rightRange];
  }

  const middleRange = range(leftSiblingIndex, rightSiblingIndex);
  return [1, 'dots', ...middleRange, 'dots', total];
}

function SmartPagination({
  current,
  total,
  onChange,
  totalResults,
  siblingCount = 1,
  showFirstLast = true,
}) {
  const items = useMemo(() => getPageItems({ current, total, siblingCount }), [current, total, siblingCount]);
  const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  const [showJump, setShowJump] = useState(false);
  const [jumpVal, setJumpVal] = useState(String(current));

  useEffect(() => setJumpVal(String(current)), [current]);

  const go = (p) => {
    const clamped = Math.max(1, Math.min(total, p));
    if (clamped !== current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onChange(clamped);
    }
  };

  // Keyboard shortcuts: ←/→, PageUp/PageDown, Home/End
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        if (current > 1) go(current - 1);
      } else if (['ArrowRight', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        if (current < total) go(current + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        go(total);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, total]);

  return (
    <nav className={styles.paginationWrap} aria-label="Pagination">
      {/* Progress bar */}
      <div className={styles.progressTrack} aria-hidden="true">
        <motion.div
          className={styles.progressBar}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        />
      </div>

      {/* Top row: numbers + prev/next */}
      <div className={styles.pageTopRow}>
        {showFirstLast && (
          <motion.button
            type="button"
            className={`${styles.pageBtn} ${current <= 1 ? styles.disabled : ''}`}
            onClick={() => go(1)}
            disabled={current <= 1}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            title="First page"
            aria-label="First page"
          >
            « First
          </motion.button>
        )}
        <motion.button
          type="button"
          className={`${styles.pageBtn} ${current <= 1 ? styles.disabled : ''}`}
          onClick={() => go(current - 1)}
          disabled={current <= 1}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          title="Previous page"
          aria-label="Previous page"
        >
          ‹ Prev
        </motion.button>

        <motion.div layout className={styles.pageGroup}>
          <AnimatePresence initial={false}>
            {items.map((it, idx) =>
              it === 'dots' ? (
                <motion.span
                  key={`dots-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className={styles.ellipsis}
                  aria-hidden="true"
                >
                  …
                </motion.span>
              ) : (
                <motion.button
                  key={it}
                  layout
                  type="button"
                  className={`${styles.pageNumber} ${it === current ? styles.current : ''}`}
                  disabled={it === current}
                  onClick={() => go(it)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  title={`Page ${it}`}
                  aria-label={`Page ${it}`}
                  aria-current={it === current ? 'page' : undefined}
                >
                  {it}
                </motion.button>
              )
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          type="button"
          className={`${styles.pageBtn} ${current >= total ? styles.disabled : ''}`}
          onClick={() => go(current + 1)}
          disabled={current >= total}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          title="Next page"
          aria-label="Next page"
        >
          Next ›
        </motion.button>
        {showFirstLast && (
          <motion.button
            type="button"
            className={`${styles.pageBtn} ${current >= total ? styles.disabled : ''}`}
            onClick={() => go(total)}
            disabled={current >= total}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            title="Last page"
            aria-label="Last page"
          >
            Last »
          </motion.button>
        )}
      </div>

      {/* Info + jump */}
      <div className={styles.pageInfoRow}>
        <span className={styles.pageInfoChip}>
          Page {current} of {total}
        </span>
        {typeof totalResults === 'number' && totalResults > 0 && (
          <span className={styles.pageInfoChip}>{totalResults} results</span>
        )}

        <button
          type="button"
          className={styles.jumpToggle}
          onClick={() => setShowJump((s) => !s)}
          aria-expanded={showJump}
          aria-controls="jump-popover"
        >
          Jump to
        </button>

        <AnimatePresence>
          {showJump && (
            <motion.form
              id="jump-popover"
              className={styles.jump}
              initial={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
              onSubmit={(e) => {
                e.preventDefault();
                const num = parseInt(jumpVal, 10);
                if (!Number.isNaN(num)) {
                  go(num);
                }
              }}
            >
              <input
                type="number"
                min={1}
                max={total}
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                className={styles.jumpInput}
                aria-label="Page number"
              />
              <button type="submit" className={styles.pageBtn}>Go</button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = (searchParams.get('query') || '').trim();
  const special = (searchParams.get('special') || '').trim();
  const genres = (searchParams.get('genres') || '').trim();
  const movieGenres = (searchParams.get('movieGenres') || '').trim();
  const tvGenres = (searchParams.get('tvGenres') || '').trim();
  const language = (searchParams.get('language') || '').trim();
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [serverPaged, setServerPaged] = useState({ totalPages: 1, totalResults: 0 });
  const [isServerPaged, setIsServerPaged] = useState(false); // NEW: detect server pagination

  useEffect(() => {
    const fetchSearchResults = async () => {
      // Special category handling
      if (special) {
        setLoading(true);
        setErrorMsg('');
        let url = '';
        if (special === 'trending-movies') {
          url = `${serverUrl}/api/trending-picks?type=movie`;
        } else if (special === 'popular-tv-shows') {
          url = `${serverUrl}/api/trending-picks?type=tv`;
        } else if (special === 'top-rated') {
          url = `${serverUrl}/api/top-rated-movies`;
        } else if (special === 'new-releases') {
          url = `${serverUrl}/api/discover/movie?sort_by=release_date.desc`;
        }
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || res.statusText || 'Unknown error');
          }
          const data = await res.json();
          setIsServerPaged(false);
          setResults(data);
          setServerPaged({
            totalPages: Math.max(1, Math.ceil(data.length / PAGE_SIZE_FALLBACK)),
            totalResults: data.length,
          });
        } catch (err) {
          setErrorMsg(err.message || 'Failed to fetch search results.');
          setResults([]);
          setServerPaged({ totalPages: 1, totalResults: 0 });
          setIsServerPaged(false);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!query && !genres && !movieGenres && !tvGenres) {
        setResults([]);
        setLoading(false);
        setServerPaged({ totalPages: 1, totalResults: 0 });
        setIsServerPaged(false);
        return;
      }

      setLoading(true);
      setErrorMsg('');

      try {
        let url = '';
        if (movieGenres || tvGenres) {
          const params = new URLSearchParams();
          if (movieGenres) params.append('movieGenres', movieGenres);
          if (tvGenres) params.append('tvGenres', tvGenres);
          if (language) params.append('language', language);
          params.append('page', pageParam);
          url = `${serverUrl}/api/search?${params.toString()}`;
        } else if (genres) {
          url = `${serverUrl}/api/search?query=${encodeURIComponent(`GENRE_SEARCH_${genres}`)}&page=${pageParam}`;
        } else {
          url = `${serverUrl}/api/search?query=${encodeURIComponent(query)}&page=${pageParam}`;
        }

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || res.statusText || 'Unknown error');
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setIsServerPaged(false);
          setResults(data);
          setServerPaged({
            totalPages: Math.max(1, Math.ceil(data.length / PAGE_SIZE_FALLBACK)),
            totalResults: data.length,
          });
        } else {
          const arr = Array.isArray(data.results) ? data.results : [];
          setIsServerPaged(true);
          setResults(arr);
          setServerPaged({
            totalPages: parseInt(data.total_pages || '1', 10),
            totalResults: parseInt(data.total_results || arr.length || '0', 10),
          });
        }
      } catch (err) {
        console.error('Failed to fetch search results:', err);
        setErrorMsg(err.message || 'Failed to fetch search results.');
        setResults([]);
        setServerPaged({ totalPages: 1, totalResults: 0 });
        setIsServerPaged(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, genres, movieGenres, tvGenres, language, pageParam, special]);

  // Build the list to display
  const { paged, totalPages } = useMemo(() => {
    let tp = serverPaged.totalPages || 1;
    if (isServerPaged) {
      return { paged: results, totalPages: tp };
    }
    if (Array.isArray(results) && tp > 1) {
      const start = (pageParam - 1) * PAGE_SIZE_FALLBACK;
      const end = start + PAGE_SIZE_FALLBACK;
      return { paged: results.slice(start, end), totalPages: tp };
    }
    return { paged: results, totalPages: tp };
  }, [results, pageParam, serverPaged, isServerPaged]);

  // Split results into movies and tv shows if using advanced genre search
  const isAdvancedGenreSearch = !!(movieGenres || tvGenres);
  const movies = useMemo(() => paged.filter(item => item.media_type === 'movie'), [paged]);
  const tvShows = useMemo(() => paged.filter(item => item.media_type === 'tv'), [paged]);

  // If user navigates beyond total pages (e.g., back/forward), clamp it.
  useEffect(() => {
    if (!loading && !errorMsg && totalPages > 0 && pageParam > totalPages) {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (genres) params.set('genres', genres);
      if (movieGenres) params.set('movieGenres', movieGenres);
      if (tvGenres) params.set('tvGenres', tvGenres);
      if (language) params.set('language', language);
      params.set('page', String(totalPages));
      router.replace(`/search?${params.toString()}`);
    }
  }, [
    loading,
    errorMsg,
    totalPages,
    pageParam,
    query,
    genres,
    movieGenres,
    tvGenres,
    language,
    router
  ]);

  const goToPage = (p) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (genres) params.set('genres', genres);
    if (movieGenres) params.set('movieGenres', movieGenres);
    if (tvGenres) params.set('tvGenres', tvGenres);
    if (language) params.set('language', language);
    params.set('page', String(p));
    router.push(`/search?${params.toString()}`);
  };

  // Map genre IDs to names for display
  const GENRE_ID_TO_NAME = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
  };
  let titleLabel = `“${query}”`;
  if (genres) {
    const names = genres.split(',').map(id => GENRE_ID_TO_NAME[parseInt(id, 10)]).filter(Boolean);
    titleLabel = names.length ? `Genres: ${names.join(', ')}` : `Genres: ${genres}`;
  } else if (isAdvancedGenreSearch) {
    const movieNames = movieGenres ? movieGenres.split(',').map(id => GENRE_ID_TO_NAME[parseInt(id, 10)]).filter(Boolean) : [];
    const tvNames = tvGenres ? tvGenres.split(',').map(id => GENRE_ID_TO_NAME[parseInt(id, 10)]).filter(Boolean) : [];
    let label = [];
    if (movieNames.length) label.push(`Movie Genres: ${movieNames.join(', ')}`);
    if (tvNames.length) label.push(`TV Genres: ${tvNames.join(', ')}`);
    if (language) label.push(`Language: ${language}`);
    titleLabel = label.join(' | ');
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={styles.title}
          >
            Search Results {titleLabel && <span className={styles.titleAccent}>{titleLabel}</span>}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className={styles.metaRow}
          >
            {!loading && !errorMsg && (
              <span className={styles.metaChip}>
                {serverPaged.totalResults ? `${serverPaged.totalResults} results` : `${paged.length} results`}
              </span>
            )}
            {loading && <span className={styles.metaChip}>Loading…</span>}
            {errorMsg && <span className={styles.metaChipError}>Error</span>}
          </motion.div>
        </div>
        <div className={styles.heroGlow} />
      </header>

      {/* Content */}
      <motion.main initial="hidden" animate="visible" variants={containerVariants} className={styles.content}>
        {/* Loading */}
        {loading && (
          <motion.div variants={containerVariants} className={styles.grid}>
            {Array.from({ length: 12 }).map((_, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <MovieCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Error */}
        {!loading && errorMsg && (
          <motion.div variants={itemVariants} className={styles.errorBox}>
            {errorMsg}
          </motion.div>
        )}

        {/* Empty */}
        {!loading && !errorMsg && paged.length === 0 && (
          <motion.div variants={itemVariants} className={styles.emptyBox}>
            No results found {query ? `for “${query}”` : ''}.
          </motion.div>
        )}

        {/* Results */}
        {!loading && !errorMsg && paged.length > 0 && (
          <>
            {isAdvancedGenreSearch ? (
              <>
                {/* Movies Block */}
                {movies.length > 0 && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 mt-2">Movies</h2>
                    <motion.div variants={containerVariants} className={styles.grid}>
                      {movies.map((movie) =>
                        movie?.id && (movie.title || movie.name) ? (
                          <motion.div key={movie.id} variants={itemVariants}>
                            <MovieCard movie={movie} />
                          </motion.div>
                        ) : null
                      )}
                    </motion.div>
                  </>
                )}
                {/* TV Shows Block */}
                {tvShows.length > 0 && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 mt-8">TV Shows / Web Series</h2>
                    <motion.div variants={containerVariants} className={styles.grid}>
                      {tvShows.map((tv) =>
                        tv?.id && (tv.title || tv.name) ? (
                          <motion.div key={tv.id} variants={itemVariants}>
                            <MovieCard movie={tv} />
                          </motion.div>
                        ) : null
                      )}
                    </motion.div>
                  </>
                )}
              </>
            ) : (
              <motion.div variants={containerVariants} className={styles.grid}>
                {paged.map((movie) =>
                  movie?.id && (movie.title || movie.name) ? (
                    <motion.div key={movie.id} variants={itemVariants}>
                      <MovieCard movie={movie} />
                    </motion.div>
                  ) : null
                )}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <SmartPagination
                current={pageParam}
                total={totalPages}
                onChange={goToPage}
                totalResults={serverPaged.totalResults || undefined}
              />
            )}
          </>
        )}
      </motion.main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)] pt-24 px-4 flex items-center justify-center text-xl">
          Loading search page...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}