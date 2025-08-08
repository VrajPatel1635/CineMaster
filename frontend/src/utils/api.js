// frontend/src/utils/api.js
export const getTrendingMovies = async () => {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
  );
  const data = await res.json();

  // Fetch trailers for each movie
  const moviesWithTrailers = await Promise.all(
    data.results.map(async movie => {
      const trailerRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
      const trailerData = await trailerRes.json();
      const trailer = trailerData.results.find(
        vid => vid.type === 'Trailer' && vid.site === 'YouTube'
      );
      return {
        ...movie,
        trailerId: trailer?.key || null,
      };
    })
  );

  return moviesWithTrailers.filter(m => m.trailerId); // Only include if trailer exists
};
