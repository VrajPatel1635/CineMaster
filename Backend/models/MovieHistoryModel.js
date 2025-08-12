// Backend/models/MovieHistoryModel.js
import mongoose from 'mongoose';

const movieHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true,
    },
    watchedMovies: [
        {
            movieId: {
                type: Number,
                required: true,
            },
            title: {
                type: String,
                required: false, 
            },
            genreIds: {
                type: [Number],
                required: true,
            },
            viewedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: true,
});

const MovieHistory = mongoose.models.MovieHistory || mongoose.model('MovieHistory', movieHistorySchema);

export default MovieHistory;
