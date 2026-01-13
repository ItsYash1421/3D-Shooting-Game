import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/game';

class APIClient {
    async submitScore(scoreData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/score`, scoreData);
            return response.data;
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }

    async getLeaderboard(limit = 10, timeframe = 'all') {
        try {
            const response = await axios.get(`${API_BASE_URL}/leaderboard`, {
                params: { limit, timeframe }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            throw error;
        }
    }

    async getPlayerStats(playerName) {
        try {
            const response = await axios.get(`${API_BASE_URL}/stats/${playerName}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching player stats:', error);
            throw error;
        }
    }

    async endSession(playerName) {
        try {
            const response = await axios.post(`${API_BASE_URL}/session/end`, { playerName });
            return response.data;
        } catch (error) {
            console.error('Error ending session:', error);
            throw error;
        }
    }

    async getGlobalStats() {
        try {
            const response = await axios.get(`${API_BASE_URL}/global-stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching global stats:', error);
            throw error;
        }
    }
}

export default new APIClient();
