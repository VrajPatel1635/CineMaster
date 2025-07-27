// src/components/SearchBar.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, X } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const router = useRouter(); 

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = (e) => { 
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
      // setQuery('');
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
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
          focus-within:border-indigo-500 dark:focus-within:border-indigo-400
          transition-all duration-200 ease-in-out
        "
      >
        <Search size={20} className="text-zinc-500 dark:text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search movies or shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        <button
          type="submit"
          className="sr-only"
          aria-label="Submit search"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default SearchBar;