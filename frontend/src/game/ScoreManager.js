import apiClient from '../utils/apiClient.js';

// ------------------------------------------------------
// This will store and manage the score of each round
// ------------------------------------------------------
class ScoreManager {
    constructor() {
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.round = 1;
        this.playerName = 'Player1';
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addHit(points = 100) {
        this.hits++;
        this.score += points;
    }

    addMiss() {
        this.misses++;
    }

    getScore() {
        return this.score;
    }

    getHits() {
        return this.hits;
    }

    getMisses() {
        return this.misses;
    }

    getAccuracy() {
        const totalShots = this.hits + this.misses;
        return totalShots > 0 ? ((this.hits / totalShots) * 100).toFixed(1) : 0;
    }

    getRound() {
        return this.round;
    }

    setPlayerName(name) {
        this.playerName = name || 'Player1';
    }

    getPlayerName() {
        return this.playerName;
    }

    async submitScore(coinsSpawned) {
        try {
            const scoreData = {
                playerName: this.playerName,
                score: this.score,
                hits: this.hits,
                misses: this.misses,
                round: this.round,
                sessionId: this.sessionId,
                coinsSpawned: coinsSpawned
            };

            const result = await apiClient.submitScore(scoreData);
            return result;
        } catch (error) {
            console.error('Failed to submit score:', error);
            throw error;
        }
    }

    nextRound() {
        this.round++;
    }

    reset() {
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.round = 1;
        this.sessionId = this.generateSessionId();
    }

    getStats() {
        return {
            score: this.score,
            hits: this.hits,
            misses: this.misses,
            accuracy: this.getAccuracy(),
            round: this.round,
            playerName: this.playerName
        };
    }
}

export default ScoreManager;
