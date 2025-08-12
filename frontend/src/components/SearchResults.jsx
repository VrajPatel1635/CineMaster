
import YouTube from "react-youtube";
import { useTheme } from '@/context/ThemeContext';

const SearchResults = ({ results }) => {
  const { theme } = useTheme();
  const cardBg = theme === 'dark'
    ? 'bg-[color:var(--color-background-secondary)]'
    : 'bg-[color:var(--color-background-secondary)]';
  const cardText = theme === 'dark'
    ? 'text-[color:var(--color-text-primary)]'
    : 'text-[color:var(--color-text-primary)]';
  const cardShadow = theme === 'dark'
    ? 'shadow-lg shadow-black/40'
    : 'shadow-lg shadow-zinc-300/30';
  const secondaryText = theme === 'dark'
    ? 'text-[color:var(--color-text-secondary)]'
    : 'text-[color:var(--color-text-secondary)]';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {results.map((movie) => (
        <div
          key={movie.id}
          className={`p-3 rounded-lg ${cardBg} ${cardText} ${cardShadow} transition-colors duration-300`}
        >
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
            alt={movie.title}
            className="rounded mb-2 w-full object-cover aspect-[2/3] bg-[color:var(--color-glass-bg)]"
          />
          <h2 className="text-lg font-semibold line-clamp-2 mb-1">{movie.title}</h2>
          <p className="mb-1">⭐ {movie.rating}</p>
          {movie.trailerKey ? (
            <YouTube videoId={movie.trailerKey} className="mt-2" />
          ) : (
            <p className={`mt-2 text-xs ${secondaryText}`}>No trailer available</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
