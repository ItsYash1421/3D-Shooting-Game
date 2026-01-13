import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true,
        trim: true
    },
    totalRounds: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    },
    totalHits: {
        type: Number,
        default: 0
    },
    totalMisses: {
        type: Number,
        default: 0
    },
    averageAccuracy: {
        type: Number,
        default: 0
    },
    highestScore: {
        type: Number,
        default: 0
    },
    rounds: [{
        roundNumber: Number,
        score: Number,
        hits: Number,
        misses: Number,
        accuracy: Number,
        timestamp: Date
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ----------------------------------------------
// Using indexing for fast queries
// ----------------------------------------------
gameSessionSchema.index({ playerName: 1 });
gameSessionSchema.index({ totalScore: -1 });
gameSessionSchema.index({ startTime: -1 });

const GameSession = mongoose.model('GameSession', gameSessionSchema);

export default GameSession;
