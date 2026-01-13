import express from 'express';
import Score from '../models/Score.js';
import GameSession from '../models/GameSession.js';

const router = express.Router();

// ----------------------------------------------
// Api to Submit the score
// ----------------------------------------------
router.post('/score', async (req, res) => {
    try {
        const {
            playerName,
            score,
            hits,
            misses,
            round,
            sessionId,
            coinsSpawned
        } = req.body;

        if (!playerName || score === undefined || hits === undefined || round === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const totalShots = hits + (misses || 0);
        const accuracy = totalShots > 0 ? (hits / totalShots * 100) : 0;

        const newScore = new Score({
            playerName,
            score,
            hits,
            misses: misses || 0,
            accuracy: parseFloat(accuracy.toFixed(2)),
            round,
            sessionId,
            coinsSpawned: coinsSpawned || 0
        });

        await newScore.save();

        let session = await GameSession.findOne({
            playerName,
            isActive: true
        }).sort({ startTime: -1 });

        if (!session) {
            session = new GameSession({
                playerName,
                totalRounds: 1,
                totalScore: score,
                totalHits: hits,
                totalMisses: misses || 0,
                averageAccuracy: accuracy,
                highestScore: score,
                rounds: [{
                    roundNumber: round,
                    score,
                    hits,
                    misses: misses || 0,
                    accuracy,
                    timestamp: new Date()
                }]
            });
        } else {
            session.totalRounds += 1;
            session.totalScore += score;
            session.totalHits += hits;
            session.totalMisses += (misses || 0);
            session.highestScore = Math.max(session.highestScore, score);

            const totalShots = session.totalHits + session.totalMisses;
            session.averageAccuracy = totalShots > 0
                ? parseFloat((session.totalHits / totalShots * 100).toFixed(2))
                : 0;

            session.rounds.push({
                roundNumber: round,
                score,
                hits,
                misses: misses || 0,
                accuracy,
                timestamp: new Date()
            });
        }

        await session.save();

        res.status(201).json({
            success: true,
            message: 'Score submitted successfully',
            data: {
                score: newScore,
                session: {
                    totalScore: session.totalScore,
                    totalRounds: session.totalRounds,
                    averageAccuracy: session.averageAccuracy
                }
            }
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting score',
            error: error.message
        });
    }
});

// ----------------------------------------------
// Api to return leaderboard data
// ----------------------------------------------
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const timeframe = req.query.timeframe; 

        let dateFilter = {};
        const now = new Date();

        switch (timeframe) {
            case 'today':
                dateFilter = {
                    timestamp: {
                        $gte: new Date(now.setHours(0, 0, 0, 0))
                    }
                };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { timestamp: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { timestamp: { $gte: monthAgo } };
                break;
            default:
                dateFilter = {};
        }

        const topScores = await Score.find(dateFilter)
            .sort({ score: -1 })
            .limit(limit)
            .select('playerName score hits accuracy round timestamp');

        res.json({
            success: true,
            data: topScores,
            count: topScores.length
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard',
            error: error.message
        });
    }
});

// ----------------------------------------------
// Api for get player stats
// ----------------------------------------------
router.get('/stats/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;

        const scores = await Score.find({ playerName })
            .sort({ timestamp: -1 });

        if (scores.length === 0) {
            return res.json({
                success: true,
                message: 'No stats found for this player',
                data: null
            });
        }

        const totalGames = scores.length;
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        const totalHits = scores.reduce((sum, s) => sum + s.hits, 0);
        const totalMisses = scores.reduce((sum, s) => sum + s.misses, 0);
        const highestScore = Math.max(...scores.map(s => s.score));
        const averageScore = totalScore / totalGames;
        const totalShots = totalHits + totalMisses;
        const overallAccuracy = totalShots > 0 ? (totalHits / totalShots * 100) : 0;

        const sessions = await GameSession.find({ playerName })
            .sort({ startTime: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                playerName,
                totalGames,
                totalScore,
                averageScore: parseFloat(averageScore.toFixed(2)),
                highestScore,
                totalHits,
                totalMisses,
                overallAccuracy: parseFloat(overallAccuracy.toFixed(2)),
                recentScores: scores.slice(0, 10),
                recentSessions: sessions
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
});

// ----------------------------------------------
// Get all session of palyer
// ----------------------------------------------
router.get('/sessions/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;
        const sessions = await GameSession.find({ playerName })
            .sort({ startTime: -1 });

        res.json({
            success: true,
            data: sessions,
            count: sessions.length
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sessions',
            error: error.message
        });
    }
});

// ----------------------------------------------
// End the session of game
// ----------------------------------------------
router.post('/session/end', async (req, res) => {
    try {
        const { playerName } = req.body;

        const session = await GameSession.findOneAndUpdate(
            { playerName, isActive: true },
            {
                isActive: false,
                endTime: new Date()
            },
            { new: true, sort: { startTime: -1 } }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active session found'
            });
        }

        res.json({
            success: true,
            message: 'Session ended successfully',
            data: session
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            message: 'Error ending session',
            error: error.message
        });
    }
});

// ----------------------------------------------
// Api for total or all stats
// ----------------------------------------------
router.get('/global-stats', async (req, res) => {
    try {
        const totalGames = await Score.countDocuments();
        const totalPlayers = await Score.distinct('playerName').then(names => names.length);

        const highestScoreDoc = await Score.findOne().sort({ score: -1 });
        const recentGames = await Score.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .select('playerName score hits timestamp');

        res.json({
            success: true,
            data: {
                totalGames,
                totalPlayers,
                highestScore: highestScoreDoc ? {
                    score: highestScoreDoc.score,
                    playerName: highestScoreDoc.playerName,
                    hits: highestScoreDoc.hits
                } : null,
                recentGames
            }
        });
    } catch (error) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching global stats',
            error: error.message
        });
    }
});

export default router;
