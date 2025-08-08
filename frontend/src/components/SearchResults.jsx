// frontend/src/components/SearchResults.jsx
import YouTube from "react-youtube";

const SearchResults = ({ results }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {results.map((movie) => (
        <div key={movie.id} className="bg-gray-900 p-3 rounded-lg shadow-lg">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
            alt={movie.title}
            className="rounded mb-2"
          />
          <h2 className="text-lg font-semibold">{movie.title}</h2>
          <p>⭐ {movie.rating}</p>
          {movie.trailerKey ? (
            <YouTube videoId={movie.trailerKey} className="mt-2" />
          ) : (
            <p className="text-gray-400 mt-2">No trailer available</p>
          )}
        </div>
      ))}
    </div>
  );
};
