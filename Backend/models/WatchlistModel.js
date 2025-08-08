// Backend/models/WatchlistModel.js
import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true, 
    },
    movies: [{
        movieId: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        genreIds: {
            type: [Number],
            required: false, 
        },
        poster_path: { 
            type: String,
            required: false,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],
}, {
    timestamps: true,
});

const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist', watchlistSchema); 

export default Watchlist;
