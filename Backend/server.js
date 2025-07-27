// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('TMDb Proxy Server is running!');
});

// Search API endpoint (no change)
app.get("/api/search", async (req, res) => {
  const query = req.query.query;

  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error: TMDB API Key missing." });
  }

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
    res.status(500).json({ error: "Internal server error. Failed to process movie search." });
  }
});

// Details API endpoint (no change)
app.get("/api/details/:mediaType/:id", async (req, res) => {
    const { mediaType, id } = req.params;

    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is not set in environment variables.");
        return res.status(500).json({ error: "Server configuration error: TMDB API Key missing." });
    }

    if (!id || !mediaType || !['movie', 'tv'].includes(mediaType)) {
        return res.status(400).json({ error: "Invalid ID or media type. Media type must be 'movie' or 'tv'." });
    }

    try {
        // Fetch main details
        const detailsRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}`
        );

        if (!detailsRes.ok) {
            const tmdbError = await detailsRes.json().catch(() => ({ status_message: 'Failed to parse TMDb error response.' }));
            console.error(`TMDb API details error: Status ${detailsRes.status}, Message: ${tmdbError.status_message}`);
            return res.status(detailsRes.status).json({ error: tmdbError.status_message || "Failed to fetch details from TMDb API." });
        }

        const data = await detailsRes.json();

        // Fetch videos (trailers)
        const videosRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${TMDB_API_KEY}`
        );
        
        let trailerKey = null;
        if (videosRes.ok) {
            const videoData = await videosRes.json();
            // Find a YouTube trailer
            const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (trailer) {
                trailerKey = trailer.key;
            }
        } else {
            console.warn(`Could not fetch videos for ${mediaType} ID ${id}: Status ${videosRes.status}`);
        }

        // Combine details with trailer key and send
        res.json({ ...data, trailerKey });

    } catch (err) {
        console.error("Server error fetching movie/TV details or videos:", err);
        res.status(500).json({ error: "Internal server error. Failed to fetch details or videos." });
    }
});

// --- NEW ENDPOINT FOR BATCH FETCHING TRENDING PICKS WITH TRAILERS ---
app.get("/api/trending-picks", async (req, res) => {
    const { language, region, originalLanguage, type = 'movie', limit = 6 } = req.query;

    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is not set in environment variables.");
        return res.status(500).json({ error: "Server configuration error: TMDB API Key missing." });
    }

    let tmdbUrl;
    if (originalLanguage) {
        // Use discover endpoint for specific original language
        tmdbUrl = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&language=${language || 'en-US'}&sort_by=popularity.desc&with_original_language=${originalLanguage}`;
        if (region) {
            tmdbUrl += `&region=${region}`;
        }
    } else {
        // Use trending endpoint for general trending
        tmdbUrl = `https://api.themoviedb.org/3/trending/${type}/week?api_key=${TMDB_API_KEY}&language=${language || 'en-US'}`;
        if (region) {
            tmdbUrl += `&region=${region}`;
        }
    }

    try {
        const trendingRes = await fetch(tmdbUrl);

        if (!trendingRes.ok) {
            const tmdbError = await trendingRes.json().catch(() => ({ status_message: 'Failed to parse TMDb error response.' }));
            console.error(`TMDb API trending error: Status ${trendingRes.status}, Message: ${tmdbError.status_message}`);
            return res.status(trendingRes.status).json({ error: tmdbError.status_message || "Failed to fetch trending movies from TMDb API." });
        }

        const trendingData = await trendingRes.json();
        const topPicks = trendingData.results.slice(0, parseInt(limit));

        const moviesWithTrailers = await Promise.all(
            topPicks.map(async (movie) => {
                let trailerUrl = null;
                try {
                    const videosRes = await fetch(
                        `https://api.themoviedb.org/3/${type}/${movie.id}/videos?api_key=${TMDB_API_KEY}`
                    );
                    if (videosRes.ok) {
                        const videoData = await videosRes.json();
                        const trailer = videoData.results.find(
                            (vid) => vid.type === "Trailer" && vid.site === "YouTube"
                        );
                        // Correct YouTube URL format for ReactPlayer
                        if (trailer) {
                            trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                        }
                    } else {
                        console.warn(`Could not fetch videos for ${movie.title || movie.name} (ID: ${movie.id}): Status ${videosRes.status}`);
                    }
                } catch (videoErr) {
                    console.error(`Error fetching video for ${movie.title || movie.name} (ID: ${movie.id}):`, videoErr);
                }
                return {
                    id: movie.id,
                    title: movie.title || movie.name,
                    overview: movie.overview,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    vote_average: movie.vote_average,
                    release_date: movie.release_date || movie.first_air_date,
                    media_type: type, // Ensure media_type is included
                    trailerUrl: trailerUrl,
                };
            })
        );

        res.json(moviesWithTrailers);

    } catch (err) {
        console.error("Server error during TMDb API call for trending picks:", err);
        res.status(500).json({ error: "Internal server error. Failed to process trending picks." });
    }
});
// --- END NEW ENDPOINT ---

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});