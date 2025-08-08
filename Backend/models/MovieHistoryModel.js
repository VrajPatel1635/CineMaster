// Backend/models/MovieHistoryModel.js
import mongoose from 'mongoose';

const movieHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // CRITICAL CHANGE: From String to ObjectId
        ref: 'User', // References the 'User' model
        required: true,
        unique: true, // Ensures one history document per user
    },
    watchedMovies: [
        {
            movieId: {
                type: Number,
                required: true,
            },
            title: {
                type: String,
                required: false, // <--- CHANGED THIS FROM 'true' TO 'false'
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
