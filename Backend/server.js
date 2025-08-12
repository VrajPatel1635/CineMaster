// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { updateUserName } from './controllers/authController.js';
import MovieHistory from './models/MovieHistoryModel.js';
import Watchlist from './models/WatchlistModel.js';
import authMiddleware from "./middlewares/authMiddleware.js";
// import mongoose from 'mongoose';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

// PATCH endpoint to update user's name
app.patch('/api/user/name', authMiddleware, updateUserName);

if (!TMDB_API_KEY) {
    console.error("CRITICAL ERROR: TMDb API Key is missing. Please set the TMDB_API_KEY environment variable in your .env file.");
    // process.exit(1); // Keep this commented out unless you want the server to exit if key is missing
}
/**
 * Helper function to fetch data from TMDb and enrich the results with a YouTube trailer URL.
 * It handles API key validation and basic error logging.
 */
const fetchAndEnrichWithTrailers = async (tmdbEndpoint, tmdbParams = {}, mediaType = 'movie') => {
    if (!TMDB_API_KEY) {
        throw new Error("TMDb API Key is missing from the server configuration.");
    }

    try {
        const fullTmdbUrl = `https://api.themoviedb.org/3${tmdbEndpoint}?api_key=${TMDB_API_KEY}&${new URLSearchParams(tmdbParams).toString()}`;
        const mainRes = await fetch(fullTmdbUrl);
        if (!mainRes.ok) {
            const tmdbError = await mainRes.json().catch(() => ({ status_message: 'Failed to parse TMDb error response.' }));
            console.error(`TMDb API error for ${tmdbEndpoint}: Status ${mainRes.status}, Message: ${tmdbError.status_message}`);
            throw new Error(`TMDb API error: ${tmdbError.status_message || "Unknown error"}`);
        }
        const mainData = await mainRes.json();
        const results = mainData.results || [];
        const enrichedResults = await Promise.all(
            results.map(async (item) => {
                const itemMediaType = item.media_type || mediaType;
                let trailerUrl = null;
                try {
                    const videosRes = await fetch(
                        `https://api.themoviedb.org/3/${itemMediaType}/${item.id}/videos?api_key=${TMDB_API_KEY}`
                    );
                    if (videosRes.ok) {
                        const videoData = await videosRes.json();
                        const trailer = videoData.results.find(
                            (vid) => vid.type === "Trailer" && vid.site === "YouTube"
                        );
                        if (trailer) {
                            trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                        }
                    } else {
                        console.warn(`Could not fetch videos for ${item.title || item.name} (ID: ${item.id}): Status ${videosRes.status}`);
                    }
                } catch (videoErr) {
                    console.error(`Error fetching video for ${item.title || item.name} (ID: ${item.id}):`, videoErr);
                }
                return {
                    id: item.id,
                    title: item.title || item.name,
                    overview: item.overview,
                    poster_path: item.poster_path,
                    backdrop_path: item.backdrop_path,
                    vote_average: item.vote_average,
                    release_date: item.release_date || item.first_air_date,
                    media_type: itemMediaType,
                    trailerUrl: trailerUrl,
                };
            })
        );

        return enrichedResults;

    } catch (err) {
        console.error("Helper function error:", err);
        throw err;
    }
};

app.get('/', (req, res) => {
    res.send('TMDb Proxy Server is running!');
});

// Genre cache per language
const GENRE_CACHE = new Map(); // key: lang -> { movieIds:Set, tvIds:Set, movieByName:Map, tvByName:Map, exp:number }
const GENRE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function normName(s = '') {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchGenreData(lang = 'en-US') {
  const now = Date.now();
  const cached = GENRE_CACHE.get(lang);
  if (cached && cached.exp > now) return cached;

  const movieUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=${encodeURIComponent(lang)}`;
  const tvUrl    = `https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=${encodeURIComponent(lang)}`;

  const [mRes, tRes] = await Promise.all([fetch(movieUrl), fetch(tvUrl)]);
  const mJson = mRes.ok ? await mRes.json() : { genres: [] };
  const tJson = tRes.ok ? await tRes.json() : { genres: [] };

  const movieIds = new Set(mJson.genres.map(g => g.id));
  const tvIds    = new Set(tJson.genres.map(g => g.id));

  const movieByName = new Map();
  mJson.genres.forEach(g => movieByName.set(normName(g.name), g.id));
  // helpful synonyms
  movieByName.set('sci fi', movieByName.get('science fiction') ?? 878);

  const tvByName = new Map();
  tJson.genres.forEach(g => tvByName.set(normName(g.name), g.id));
  // helpful synonyms
  tvByName.set('sci fi', tvByName.get('sci fi and fantasy') ?? tvByName.get('sci fi & fantasy') ?? 10765);
  // note: romance is NOT a tv genre

  const data = { movieIds, tvIds, movieByName, tvByName, exp: now + GENRE_TTL_MS };
  GENRE_CACHE.set(lang, data);
  return data;
}

async function tmdbJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    let msg = 'TMDb error';
    try { const e = await r.json(); msg = e.status_message || msg; } catch {}
    throw new Error(`${msg} (${r.status})`);
  }
  return r.json();
}

function normalizeItem(item, mediaType) {
  return {
    id: item.id,
    title: item.title || item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    release_date: item.release_date || item.first_air_date,
    media_type: mediaType || item.media_type || 'movie',
  };
}

app.get("/api/search", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const language = typeof req.query.language === 'string' && req.query.language.trim() ? req.query.language : 'en-US';
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const movieGenres = typeof req.query.movieGenres === 'string' ? req.query.movieGenres.trim() : '';
  const tvGenres = typeof req.query.tvGenres === 'string' ? req.query.tvGenres.trim() : '';
  const legacyGenres = typeof req.query.genres === 'string' ? req.query.genres.trim() : '';

  try {
    const { movieIds, tvIds, movieByName, tvByName } = await fetchGenreData(language);

    // Parse advanced genre params (ids or names, comma-separated)
    const parseGenreParam = (raw, type) => {
      if (!raw) return { ids: [], romanceFlag: false, names: [] };
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      const ids = [];
      let romanceFlag = false;
      const names = [];

      for (const part of parts) {
        if (/^\d+$/.test(part)) {
          const id = parseInt(part, 10);
          if (type === 'movie' && movieIds.has(id)) ids.push(id);
          else if (type === 'tv' && tvIds.has(id)) ids.push(id);
          else if (type === 'tv' && id === 10749) romanceFlag = true; // Romance invalid for TV
        } else {
          const n = normName(part);
          names.push(n);
          if (type === 'movie' && movieByName.has(n)) ids.push(movieByName.get(n));
          else if (type === 'tv' && tvByName.has(n)) ids.push(tvByName.get(n));
          else if (type === 'tv' && n === 'romance') romanceFlag = true;
        }
      }
      // Deduplicate
      return { ids: Array.from(new Set(ids)), romanceFlag, names };
    };

    // Support legacy ?genres= (apply to both types)
    let mGenRaw = movieGenres;
    let tGenRaw = tvGenres;

    if (legacyGenres && !movieGenres && !tvGenres) {
      const parts = legacyGenres.split(',').map(s => s.trim()).filter(Boolean);
      const mIds = [];
      const tIds = [];
      for (const part of parts) {
        if (/^\d+$/.test(part)) {
          const id = parseInt(part, 10);
          if (movieIds.has(id)) mIds.push(id);
          if (tvIds.has(id)) tIds.push(id);
        } else {
          const n = normName(part);
          if (movieByName.has(n)) mIds.push(movieByName.get(n));
          if (tvByName.has(n)) tIds.push(tvByName.get(n));
          if (n === 'romance') tGenRaw = (tGenRaw ? `${tGenRaw},` : '') + 'romance';
        }
      }
      if (mIds.length) mGenRaw = mIds.join(',');
      if (tIds.length) tGenRaw = tIds.join(',');
    }

    const { ids: mIdsParsed } = parseGenreParam(mGenRaw, 'movie');
    const { ids: tIdsParsed, romanceFlag: tvRomanceFlag } = parseGenreParam(tGenRaw, 'tv');

    const hasAdvanced = (mIdsParsed.length > 0) || (tIdsParsed.length > 0) || tvRomanceFlag;

    if (hasAdvanced) {
      const requests = [];
      let totalResults = 0;
      let totalPages = 0;
      const merged = [];

      // discover/movie
      if (mIdsParsed.length) {
        const params = new URLSearchParams({
          api_key: TMDB_API_KEY,
          language,
          with_genres: mIdsParsed.join(','),
          sort_by: 'popularity.desc',
          include_adult: 'false',
          include_video: 'false',
          'vote_count.gte': '1',
          page: String(page),
        });
        requests.push(
          tmdbJson(`https://api.themoviedb.org/3/discover/movie?${params.toString()}`)
            .then(d => {
              const arr = (d.results || []).map(i => normalizeItem(i, 'movie'));
              merged.push(...arr);
              totalResults += d.total_results || 0;
              totalPages = Math.max(totalPages, d.total_pages || 1);
            })
        );
      }

      // discover/tv OR romance fallback
      if (tIdsParsed.length) {
        const params = new URLSearchParams({
          api_key: TMDB_API_KEY,
          language,
          with_genres: tIdsParsed.join(','),
          sort_by: 'popularity.desc',
          include_adult: 'false',
          include_video: 'false',
          'vote_count.gte': '1',
          page: String(page),
        });
        requests.push(
          tmdbJson(`https://api.themoviedb.org/3/discover/tv?${params.toString()}`)
            .then(d => {
              const arr = (d.results || []).map(i => normalizeItem(i, 'tv'));
              merged.push(...arr);
              totalResults += d.total_results || 0;
              totalPages = Math.max(totalPages, d.total_pages || 1);
            })
        );
      } else if (tvRomanceFlag) {
        // Graceful fallback for Romance TV: text search
        const params = new URLSearchParams({
          api_key: TMDB_API_KEY,
          language,
          query: 'romance',
          include_adult: 'false',
          page: String(page),
        });
        requests.push(
          tmdbJson(`https://api.themoviedb.org/3/search/tv?${params.toString()}`)
            .then(d => {
              const arr = (d.results || []).map(i => normalizeItem(i, 'tv'));
              merged.push(...arr);
              totalResults += d.total_results || 0;
              totalPages = Math.max(totalPages, d.total_pages || 1);
            })
        );
      }

      await Promise.all(requests);

      // Sort merged by most recent air/release date (optional)
      merged.sort((a, b) => {
        const da = new Date(a.release_date || 0).getTime();
        const db = new Date(b.release_date || 0).getTime();
        return db - da;
      });

      return res.json({
        results: merged,
        total_results: totalResults || merged.length,
        total_pages: totalPages || 1,
        page,
      });
    }

    // Default: text search (search/multi)
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language,
      query,
      include_adult: 'false',
      page: String(page),
    });
    const data = await tmdbJson(`https://api.themoviedb.org/3/search/multi?${params.toString()}`);
    const arr = (data.results || [])
      .filter(i => i.media_type !== 'person')
      .map(i => normalizeItem(i));
    return res.json({
      results: arr,
      total_results: data.total_results || arr.length,
      total_pages: data.total_pages || 1,
      page,
    });
  } catch (err) {
    console.error('Server /api/search error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

app.get('/api/search/suggest', async (req, res) => {
    try {
        if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDb API Key missing' });
        const q = (req.query.q || '').toString().trim();
        const limit = Math.min(parseInt(req.query.limit || '8', 10), 20);

        // Cache key
        const key = q ? `suggest:q:${q}:${limit}` : `suggest:trending:${limit}`;
        const cached = getCache(key);
        if (cached) return res.json({ suggestions: cached });

        let suggestions = [];

        if (!q) {
            // Use trending as default suggestions
            const tRes = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`);
            const tData = await tRes.json();
            const names = (tData.results || [])
                .map(i => i.title || i.name)
                .filter(Boolean);
            // Unique, compact list
            suggestions = [...new Set(names)].slice(0, limit);
        } else {
            // Use multi search for typed suggestions
            const sRes = await fetch(
                `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${TMDB_API_KEY}`
            );
            const sData = await sRes.json();
            const names = (sData.results || [])
                .filter(i => i.media_type !== 'person')
                .map(i => i.title || i.name)
                .filter(Boolean);
            suggestions = [...new Set(names)].slice(0, limit);
        }

        setCache(key, suggestions, 60_000);
        res.json({ suggestions });
    } catch (err) {
        console.error('Suggest error:', err);
        res.status(500).json({ error: 'Failed to build suggestions' });
    }
});
// New Releases endpoint: discover movies sorted by release date
app.get('/api/discover/movie', async (req, res) => {
    try {
        const params = new URLSearchParams({
            language: req.query.language || 'en-US',
            sort_by: req.query.sort_by || 'release_date.desc',
            page: req.query.page || '1',
            api_key: TMDB_API_KEY,
        });
        const url = `https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.status_message || response.statusText || 'Unknown error');
        }
        const data = await response.json();
        res.json(data.results || []);
    } catch (err) {
        console.error('Server error fetching new releases:', err);
        res.status(500).json({ error: err.message || 'Internal server error. Failed to fetch new releases.' });
    }
});

app.get("/api/details/:mediaType/:id", async (req, res) => {
    const { mediaType, id } = req.params;

    if (!id || !['movie', 'tv'].includes(mediaType)) {
        return res.status(400).json({ error: "Invalid ID or media type. Media type must be 'movie' or 'tv'." });
    }
    try {
        const detailsRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}`
        );
        if (!detailsRes.ok) {
            const tmdbError = await detailsRes.json().catch(() => ({ status_message: 'Failed to parse TMDb error response.' }));
            console.error(`TMDb API details error: Status ${detailsRes.status}, Message: ${tmdbError.status_message}`);
            return res.status(detailsRes.status).json({ error: tmdbError.status_message || "Failed to fetch details from TMDb API." });
        }
        const data = await detailsRes.json();
        const videosRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${TMDB_API_KEY}`
        );
        let trailerKey = null;
        if (videosRes.ok) {
            const videoData = await videosRes.json();
            const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (trailer) {
                trailerKey = trailer.key;
            }
        } else {
            console.warn(`Could not fetch videos for ${mediaType} ID ${id}: Status ${videosRes.status}`);
        }
        res.json({ ...data, trailerKey })
    } catch (err) {
        console.error("Server error fetching movie/TV details or videos:", err);
        res.status(500).json({ error: err.message || "Internal server error. Failed to fetch details or videos." });
    }
});
app.get("/api/trending-picks", async (req, res) => {
    const { language, region, originalLanguage, type = 'movie', limit = 100 } = req.query;
    let tmdbEndpoint = `/trending/${type}/week`;
    let tmdbParams = { language: language || 'en-US' };

    if (originalLanguage) {
        tmdbEndpoint = `/discover/${type}`;
        tmdbParams = {
            ...tmdbParams,
            sort_by: 'popularity.desc',
            with_original_language: originalLanguage,
        };
    }
    if (region) {
        tmdbParams.region = region;
    }

    try {
        const moviesWithTrailers = await fetchAndEnrichWithTrailers(tmdbEndpoint, tmdbParams, type);
        res.json(moviesWithTrailers.slice(0, parseInt(limit)));
    } catch (err) {
        console.error("Server error during TMDb API call for trending picks:", err);
        res.status(500).json({ error: err.message || "Internal server error. Failed to process trending picks." });
    }
});

app.get('/api/popular-movies', async (req, res) => {
    try {
        const movies = await fetchAndEnrichWithTrailers('/movie/popular', { language: 'en-US' });
        res.json(movies);
    } catch (err) {
        console.error("Server error fetching popular movies:", err);
        res.status(500).json({ error: err.message || "Internal server error. Failed to fetch popular movies." });
    }
});

app.get('/api/top-rated-movies', async (req, res) => {
    try {
        const movies = await fetchAndEnrichWithTrailers('/movie/top_rated', { language: 'en-US' });
        res.json(movies);
    } catch (err) {
        console.error("Server error fetching top rated movies:", err);
        res.status(500).json({ error: err.message || "Internal server error. Failed to fetch top rated movies." });
    }
});
/**
 * Generates movie recommendations for a user based on their watched history.
 */
app.get('/api/recommendations', authMiddleware, async (req, res) => {
    // userId is now taken from req.user.id (set by authMiddleware)
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ error: "Authentication required." });
    }
    try {
        // Get both watchlist and watched history
        const userWatchlist = await Watchlist.findOne({ userId });
        const userHistory = await MovieHistory.findOne({ userId });
        let baseMovies = [];
        if (userWatchlist && userWatchlist.movies && userWatchlist.movies.length > 0) {
            baseMovies = baseMovies.concat(userWatchlist.movies);
        }
        if (userHistory && userHistory.watchedMovies && userHistory.watchedMovies.length > 0) {
            baseMovies = baseMovies.concat(userHistory.watchedMovies);
        }
        // Remove duplicates by movieId
        const seen = new Set();
        baseMovies = baseMovies.filter(m => {
            const id = m.movieId || m.id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        if (baseMovies.length === 0) {
            return res.json([]);
        }
        // Collect genre counts from baseMovies
        const genreCounts = {};
        baseMovies.forEach(movie => {
            if (movie.genreIds) {
                movie.genreIds.forEach(genreId => {
                    genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
                });
            }
        });
        const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
        const topGenres = sortedGenres.slice(0, 3).join(',');
        if (!topGenres) {
            return res.json([]);
        }
        const tmdbParams = {
            language: 'en-US',
            sort_by: 'popularity.desc',
            with_genres: topGenres,
        };
        const recommendedMovies = await fetchAndEnrichWithTrailers('/discover/movie', tmdbParams);
        // Exclude movies already in baseMovies (watchlist or history)
        const baseMovieIds = new Set(baseMovies.map(m => m.movieId || m.id));
        const filteredRecommendations = recommendedMovies.filter(movie => !baseMovieIds.has(movie.id));
        res.json(filteredRecommendations.slice(0, 20));
    } catch (err) {
        res.status(500).json({ error: err.message || "Internal server error. Failed to generate recommendations." });
    }
});
/**
 * Fetches and returns a user's movie viewing history.
 */
app.get('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const historyDoc = await MovieHistory.findOne({ userId });

        if (!historyDoc || !historyDoc.watchedMovies || historyDoc.watchedMovies.length === 0) {
            return res.json([]);
        }

        const uniqueMovies = new Map();
        historyDoc.watchedMovies.forEach(item => {
            if (!uniqueMovies.has(item.movieId) || item.viewedAt > uniqueMovies.get(item.movieId).viewedAt) {
                uniqueMovies.set(item.movieId, item);
            }
        });

        const detailedHistoryPromises = Array.from(uniqueMovies.values()).map(async (item) => {
            const detailsRes = await fetch(
                `https://api.themoviedb.org/3/movie/${item.movieId}?api_key=${TMDB_API_KEY}`
            );

            if (!detailsRes.ok) {
                console.warn(`Could not fetch details for movie ID ${item.movieId}: Status ${detailsRes.status}`);
                return null;
            }

            const movieDetails = await detailsRes.json();
            return {
                ...movieDetails,
                viewedAt: item.viewedAt,
            };
        });
        const detailedHistory = (await Promise.all(detailedHistoryPromises)).filter(Boolean);
        detailedHistory.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

        res.json(detailedHistory);
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).json({ message: 'Server error while fetching history' });
    }
});

app.delete('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to clear history.' });
        }

        const result = await MovieHistory.findOneAndUpdate(
            { userId: userId },
            { $set: { watchedMovies: [] } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'No viewing history found for this user.' });
        }

        console.log(`User ${userId}'s viewing history cleared successfully.`);
        res.status(200).json({ message: 'Viewing history cleared successfully.' });
    } catch (error) {
        console.error('Error clearing user history:', error);
        res.status(500).json({ message: 'Server error while clearing history.' });
    }
});

/**
 * Saves a movie to a user's viewing history.
 */
app.post('/api/save-history', async (req, res) => {
    const { userId, movieId, genreIds, title } = req.body;

    if (!userId || !movieId || !genreIds || !title) {
        return res.status(400).json({ error: "userId, movieId, genreIds, and title are required." });
    }

    try {
        let history = await MovieHistory.findOne({ userId });

        if (history) {
            history.watchedMovies.push({ movieId: parseInt(movieId, 10), title, genreIds, viewedAt: new Date() });
            await history.save();
        } else {
            history = new MovieHistory({
                userId,
                watchedMovies: [{ movieId: parseInt(movieId, 10), title, genreIds, viewedAt: new Date() }],
            });
            await history.save();
        }

        res.status(200).json({ message: "Movie history updated successfully." });
    } catch (err) {
        console.error("Error saving movie to history:", err);
        res.status(500).json({ error: "Internal server error. Failed to save movie to history." });
    }
});
// Delete specific movies from history
app.post('/api/history/delete-selected', async (req, res) => {
    try {
        const { userId, movieIds } = req.body;
        if (!userId || !Array.isArray(movieIds) || movieIds.length === 0) {
            return res.status(400).json({ message: 'userId and movieIds[] are required.' });
        }
        const result = await MovieHistory.findOneAndUpdate(
            { userId: userId },
            { $pull: { watchedMovies: { movieId: { $in: movieIds } } } },
            { new: true }
        );
        if (!result) {
            return res.status(404).json({ message: 'No viewing history found for this user.' });
        }
        res.status(200).json({ message: 'Selected movies deleted from history.', history: result.watchedMovies });
    } catch (error) {
        console.error('Error deleting selected movies from history:', error);
        res.status(500).json({ message: 'Server error while deleting selected movies.' });
    }
});

app.get('/api/watchlist', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const items = await Watchlist.find({ user: userId });
    res.json(items);
});

/**
 * @description Adds a movie to the user's watchlist.
 * Uses findOneAndUpdate for atomic, reliable updates.
 */
app.post('/api/watchlist/add', async (req, res) => {
    const { userId, movieId, genreIds, title, poster_path } = req.body;
    console.log(`[SERVER] Received request to add movie. User: ${userId}, Movie ID: ${movieId}`);
    if (!userId || !movieId || !title) {
        console.error("[SERVER] Missing required fields in POST request.");
        return res.status(400).json({ error: "userId, movieId, and title are required." });
    }

    const movieToAdd = {
        movieId: parseInt(movieId, 10),
        title,
        genreIds,
        poster_path,
        addedAt: new Date(),
    };

    try {
        const watchlist = await Watchlist.findOneAndUpdate(
            { userId: userId },
            { $addToSet: { movies: movieToAdd } },
            { new: true, upsert: true }
        );

        console.log(`[SERVER] Successfully added movie to watchlist for user ${userId}. Watchlist:`, watchlist);
        res.status(200).json({ message: "Movie added to watchlist successfully.", watchlist });
    } catch (err) {
        console.error("[SERVER] Error adding movie to watchlist:", err);
        res.status(500).json({ error: "Internal server error. Failed to add movie to watchlist." });
    }
});
/**
 * @description Fetches all movies in a user's watchlist.
 */
app.get('/api/watchlist/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    // Only allow access if the token's user matches the requested userId
    if (!req.user || req.user.id !== userId) {
        return res.status(403).json({ error: "Forbidden. You are not authorized to access this watchlist." });
    }
    try {
        const watchlist = await Watchlist.findOne({ userId });
        if (!watchlist || watchlist.movies.length === 0) {
            return res.json([]);
        }
        const detailedMoviesPromises = watchlist.movies.map(async (item) => {
            if (item.movieId === 999999) {
                return {
                    id: item.movieId,
                    title: item.title,
                    poster_path: item.poster_path,
                    genreIds: item.genreIds,
                    addedAt: item.addedAt,
                    overview: "This is a test movie added for demonstration and debugging purposes.",
                };
            }
            try {
                const detailsRes = await fetch(
                    `https://api.themoviedb.org/3/movie/${item.movieId}?api_key=${TMDB_API_KEY}`
                );
                if (!detailsRes.ok) {
                    return null;
                }
                const movieDetails = await detailsRes.json();
                return {
                    ...movieDetails,
                    addedAt: item.addedAt,
                    id: movieDetails.id || item.movieId
                };
            } catch (fetchError) {
                return null;
            }
        });
        const detailedWatchlist = (await Promise.all(detailedMoviesPromises)).filter(Boolean);
        detailedWatchlist.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        res.json(detailedWatchlist);
    } catch (err) {
        res.status(500).json({ error: "Internal server error. Failed to fetch watchlist." });
    }
});
/**
 * @description Checks if a specific movie is in a user's watchlist.
 */
app.get('/api/watchlist/status/:userId/:movieId', async (req, res) => {
    const { userId, movieId } = req.params;
    if (!userId || !movieId) {
        return res.status(400).json({ error: "User ID and Movie ID are required." });
    }

    try {
        const watchlist = await Watchlist.findOne({ userId });
        const inWatchlist = watchlist ? watchlist.movies.some(movie => movie.movieId === parseInt(movieId, 10)) : false;
        res.json({ inWatchlist });
    } catch (err) {
        console.error("Error checking watchlist status:", err);
        res.status(500).json({ error: "Internal server error. Failed to check watchlist status." });
    }
});
/**
 * @description Removes a movie from the user's watchlist.
 * Uses findOneAndUpdate with the $pull operator for atomic removal.
 */
app.post('/api/watchlist/remove', async (req, res) => {
    const { userId, movieId } = req.body;
    console.log(`[SERVER] Received request to remove movie. User: ${userId}, Movie ID: ${movieId}`);

    if (!userId || !movieId) {
        return res.status(400).json({ error: "userId and movieId are required to remove a movie." });
    }

    try {
        const movieIdNum = parseInt(movieId, 10);
        if (isNaN(movieIdNum)) {
            return res.status(400).json({ error: "Invalid movieId provided. Must be a number." });
        }

        const watchlist = await Watchlist.findOneAndUpdate(
            { userId: userId },
            { $pull: { movies: { movieId: movieIdNum } } },
            { new: true }
        );

        if (!watchlist) {
            console.warn(`[SERVER] Watchlist not found for user ${userId}. No movies deleted.`);
            return res.status(404).json({ message: "Watchlist not found for this user." });
        }

        res.status(200).json({ message: "Movie removed from watchlist successfully." });
    } catch (err) {
        console.error("Error removing movie from watchlist:", err);
        res.status(500).json({ error: "Internal server error. Failed to remove movie from watchlist." });
    }
});
app.post('/api/watchlist/clear', authMiddleware, async (req, res) => {
    const { userId } = req.body;
    if (!userId || req.user.id !== userId) {
        return res.status(403).json({ error: 'Forbidden. You are not authorized to clear this watchlist.' });
    }
    try {
        const result = await Watchlist.findOneAndUpdate(
            { userId },
            { $set: { movies: [] } },
            { new: true }
        );
        if (!result) {
            return res.status(404).json({ message: 'No watchlist found for this user.' });
        }
        res.status(200).json({ message: 'Watchlist cleared successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error while clearing watchlist.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});