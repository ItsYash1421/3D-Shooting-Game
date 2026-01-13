import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true,
        trim: true,
        default: 'Anonymous'
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    hits: {
        type: Number,
        required: true,
        min: 0
    },
    misses: {
        type: Number,
        default: 0,
        min: 0
    },
    accuracy: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    round: {
        type: Number,
        required: true,
        min: 1
    },
    roundDuration: {
        type: Number,
        default: 90 
    },
    coinsSpawned: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    sessionId: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString()
    }
}, {
    timestamps: true
});

// ----------------------------------------------
// Indexing
// ----------------------------------------------
scoreSchema.index({ score: -1 });
scoreSchema.index({ timestamp: -1 });
scoreSchema.index({ playerName: 1 });

scoreSchema.virtual('hitRate').get(function () {
    const totalShots = this.hits + this.misses;
    return totalShots > 0 ? (this.hits / totalShots * 100).toFixed(2) : 0;
});

const Score = mongoose.model('Score', scoreSchema);

export default Score;
