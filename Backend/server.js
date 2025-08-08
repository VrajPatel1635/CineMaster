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

app.get("/api/search", async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: "Search query is required." });
    }

    try {
        const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`
        );

        if (!searchRes.ok) {
            const tmdbError = await searchRes.json().catch(() => ({ status_message: 'Failed to parse TMDb error response.' }));
            console.error(`TMDb API error: Status ${searchRes.status}, Message: ${tmdbError.status_message}`);
            return res.status(searchRes.status).json({ error: tmdbError.status_message || "Failed to fetch from TMDb API." });
        }

        const searchData = await searchRes.json();
        const processedResults = searchData.results
            .filter(item => item.media_type !== 'person')
            .map(item => ({
                id: item.id,
                title: item.title || item.name,
                overview: item.overview,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                vote_average: item.vote_average,
                release_date: item.release_date || item.first_air_date,
                media_type: item.media_type,
            }));

        res.json(processedResults);
    } catch (err) {
        console.error("Server error during TMDb API call or processing:", err);
        res.status(500).json({ error: err.message || "Internal server error. Failed to process movie search." });
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