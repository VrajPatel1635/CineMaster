// src/components/SearchBar.jsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock } from 'lucide-react';

const STORAGE_KEY = 'cm_recent_searches';
const DEFAULT_SUGGESTIONS = [
  'Trending Movies',
  'Popular TV Shows',
  'New Releases',
  'Top Rated',
  'Action',
  'Comedy',
  'Thriller',
  'Family'
];

export default function SearchBar({
  onSearchSubmit,          // optional: () => void (e.g., close overlay)
  suggestions = DEFAULT_SUGGESTIONS, // optional: customize “Popular Searches”
  maxRecents = 8           // optional: cap recent searches
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recents, setRecents] = useState([]);
  const [openList, setOpenList] = useState(true);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const router = useRouter();

  // Autofocus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  const saveRecent = (term) => {
    try {
      const trimmed = term.trim();
      if (!trimmed) return;
      const next = [trimmed, ...recents.filter(r => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, maxRecents);
      setRecents(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const clearRecents = () => {
    setRecents([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Map special queries to category endpoints
  const SPECIAL_QUERIES = {
    'trending movies': '/search?special=trending-movies',
    'popular tv shows': '/search?special=popular-tv-shows',
    'new releases': '/search?special=new-releases',
    'top rated': '/search?special=top-rated',
  };

  const navigateToSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (SPECIAL_QUERIES[lower]) {
      router.push(SPECIAL_QUERIES[lower]);
    } else {
      router.push(`/search?query=${encodeURIComponent(trimmed)}`);
    }
    saveRecent(trimmed);
    onSearchSubmit?.();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigateToSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Build suggestion list based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    // If typing, show “Search 'query'” + matching recents + matching popular
    if (q) {
      const matchRecents = recents.filter(r => r.toLowerCase().includes(q));
      const matchPopular = suggestions.filter(s => s.toLowerCase().includes(q));
      const unique = [...new Set(matchRecents.concat(matchPopular))];
      return [`Search “${query}”`, ...unique];
    }

    // Empty query: show popular + recent sections (we’ll render them separately)
    return [];
  }, [query, recents, suggestions]);

  // Keyboard navigation in listbox
  const onKeyDown = (e) => {
    if (!openList) return;
    const hasInline = filtered.length > 0;
    if (!hasInline) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        const pick = filtered[activeIndex];
        if (pick.startsWith('Search “')) {
          navigateToSearch(query);
        } else {
          navigateToSearch(pick);
        }
      }
    } else if (e.key === 'Escape') {
      setOpenList(false);
    }
  };

  const onPick = (term) => {
    if (term.startsWith('Search “')) {
      navigateToSearch(query);
    } else {
      navigateToSearch(term);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSearch}
        className="
          flex items-center gap-2
          bg-zinc-100 dark:bg-zinc-700
          border border-zinc-300 dark:border-zinc-600
          rounded-lg
          px-4 py-2
          shadow-sm
          focus-within:border-[color:var(--color-accent)] 
          transition-all duration-200 ease-in-out
        "
      >
        <Search size={20} className="text-zinc-500 dark:text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search movies or shows..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenList(true); setActiveIndex(-1); }}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={openList}
          aria-controls="search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `search-opt-${activeIndex}` : undefined}
          className="
            bg-transparent
            w-full
            outline-none
            text-zinc-800 dark:text-zinc-100
            placeholder-zinc-500 dark:placeholder-zinc-400
            text-base
            appearance-none
          "
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors"
            aria-label="Clear search"
          >
            <X size={20} />
          </button>
        )}
        <button type="submit" className="sr-only" aria-label="Submit search">
          Submit
        </button>
      </form>

      {/* Suggestions */}
      <div className="mt-3 space-y-4">
        {/* Inline suggestions when typing */}
        {openList && filtered.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            ref={listRef}
            className="grid gap-2"
          >
            {filtered.map((s, i) => (
              <li key={s} role="option" id={`search-opt-${i}`}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg border
                    transition-colors
                    ${activeIndex === i
                      ? 'bg-[color:var(--color-background-secondary)] border-[color:var(--color-accent)] text-[color:var(--color-accent)]'
                      : 'bg-zinc-100/70 dark:bg-zinc-800/40 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200'}
                  `}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* When no query: Popular + Recent sections */}
        {(!query.trim() || !openList) && (
          <div className="grid gap-4">
            {/* Popular Searches */}
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onPick(s)}
                    className="
                      px-3 py-1.5 text-sm rounded-full
                      bg-[color:var(--color-background-secondary)]/60
                      hover:bg-[color:var(--color-background-secondary)]
                      text-[color:var(--color-text-secondary)]
                      transition-colors border border-[color:var(--color-background-tertiary)]/60
                    "
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Recent
                  </p>
                  <button
                    type="button"
                    onClick={clearRecents}
                    className="text-xs text-[color:var(--color-text-secondary)]/70 hover:text-[color:var(--color-accent)]"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recents.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onPick(r)}
                      className="
                        inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full
                        bg-zinc-100/70 dark:bg-zinc-800/40
                        hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60
                        border border-zinc-300 dark:border-zinc-700
                        text-zinc-700 dark:text-zinc-200
                        transition-colors
                      "
                    >
                      <Clock size={14} />
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}