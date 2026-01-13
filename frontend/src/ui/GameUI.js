import apiClient from '../utils/apiClient.js';

// ----------------------------------------------
// Screen where gamescreen will show
// ----------------------------------------------
class GameUI {
    constructor() {
        this.screens = {
            loading: document.getElementById('loading-screen'),
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            gameover: document.getElementById('gameover-screen'),
            leaderboard: document.getElementById('leaderboard-screen')
        };

        this.elements = {
           
            playerNameInput: document.getElementById('player-name'),
            startButton: document.getElementById('start-button'),
            leaderboardButton: document.getElementById('leaderboard-button'),

            scoreValue: document.getElementById('score-value'),
            timerValue: document.getElementById('timer-value'),
            hitsValue: document.getElementById('hits-value'),
            gestureStatus: document.getElementById('gesture-status'),
            crosshair: document.getElementById('crosshair'),

            finalScore: document.getElementById('final-score'),
            finalHits: document.getElementById('final-hits'),
            finalAccuracy: document.getElementById('final-accuracy'),
            finalRound: document.getElementById('final-round'),
            saveStatus: document.getElementById('save-status'),
            playAgainButton: document.getElementById('play-again-button'),
            menuButton: document.getElementById('menu-button'),

            leaderboardList: document.getElementById('leaderboard-list'),
            backButton: document.getElementById('back-button'),

            loadingText: document.getElementById('loading-text')
        };

        this.currentTimeframe = 'all';
        this.setupEventListeners();
    }

    setupEventListeners() {
       
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTimeframe = e.target.dataset.timeframe;
                this.loadLeaderboard();
            });
        });
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });

        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    }

    updateLoadingText(text) {
        this.elements.loadingText.textContent = text;
    }

    updateScore(score) {
        this.elements.scoreValue.textContent = score;
    }

    updateTimer(time) {
        this.elements.timerValue.textContent = time;

        if (time <= 10) {
            this.elements.timerValue.style.color = '#ff0000';
        } else if (time <= 30) {
            this.elements.timerValue.style.color = '#ffaa00';
        } else {
            this.elements.timerValue.style.color = '#FFD700';
        }
    }

    updateHits(hits) {
        this.elements.hitsValue.textContent = hits;
    }

    updateGestureStatus(hasHand, isFingerGun) {
        if (!hasHand) {
            this.elements.gestureStatus.textContent = 'AWAITING HAND DETECTION | PRESS SPACE TO SHOOT';
            this.elements.gestureStatus.style.color = '#ff3366';
        } else if (isFingerGun) {
            this.elements.gestureStatus.textContent = 'WEAPON READY | PRESS SPACE OR CLICK TO FIRE';
            this.elements.gestureStatus.style.color = '#00ff88';
        } else {
            this.elements.gestureStatus.textContent = 'POINT INDEX FINGER | PRESS SPACE TO SHOOT';
            this.elements.gestureStatus.style.color = '#ffaa00';
        }
    }

    updateCrosshairPosition(handPos) {
        if (!this.elements.crosshair) return;

        const crosshairParent = this.elements.crosshair.parentElement;

        if (!handPos) {
            return; 
        }
        const x = handPos.x * 100;
        const y = handPos.y * 100;  

        crosshairParent.style.left = x + '%';
        crosshairParent.style.top = y + '%';
        crosshairParent.style.transform = 'translate(-50%, -50%)'; 
    }

    async showGameOver(stats, coinsSpawned, scoreManager) {
        this.elements.finalScore.textContent = stats.score;
        this.elements.finalHits.textContent = stats.hits;
        this.elements.finalAccuracy.textContent = stats.accuracy + '%';
        this.elements.finalRound.textContent = stats.round;

        this.showScreen('gameover');

        try {
            this.elements.saveStatus.textContent = ' Saving score...';
            this.elements.saveStatus.className = 'save-status';

            const result = await scoreManager.submitScore(coinsSpawned);

            this.elements.saveStatus.textContent = ' Score saved successfully!';
            this.elements.saveStatus.classList.add('success');
        } catch (error) {
            console.error('Failed to save score:', error);
            this.elements.saveStatus.textContent = ' Failed to save score (offline mode)';
            this.elements.saveStatus.classList.add('error');
        }
    }

    getPlayerName() {
        return this.elements.playerNameInput.value.trim() || 'Player1';
    }

    async loadLeaderboard() {
        try {
            this.elements.leaderboardList.innerHTML = '<div class="loading-spinner"></div>';

            const result = await apiClient.getLeaderboard(20, this.currentTimeframe);

            if (result.success && result.data.length > 0) {
                this.displayLeaderboard(result.data);
            } else {
                this.elements.leaderboardList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No scores yet. Be the first!</p>';
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.elements.leaderboardList.innerHTML = '<p style="text-align: center; color: #ff6666;">Failed to load leaderboard</p>';
        }
    }

    displayLeaderboard(scores) {
        let html = '';

        scores.forEach((score, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `top-${rank}` : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

            const date = new Date(score.timestamp).toLocaleDateString();

            html += `
        <div class="leaderboard-item">
          <div class="leaderboard-rank ${rankClass}">${medal || rank}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">${this.escapeHtml(score.playerName)}</div>
            <div class="leaderboard-details">
              ${score.hits} hits • ${score.accuracy}% accuracy • Round ${score.round} • ${date}
            </div>
          </div>
          <div class="leaderboard-score">${score.score}</div>
        </div>
      `;
        });

        this.elements.leaderboardList.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    onStartGame(callback) {
        this.elements.startButton.addEventListener('click', callback);
    }

    onPlayAgain(callback) {
        this.elements.playAgainButton.addEventListener('click', callback);
    }

    onMainMenu(callback) {
        this.elements.menuButton.addEventListener('click', callback);
    }

    onShowLeaderboard(callback) {
        this.elements.leaderboardButton.addEventListener('click', () => {
            this.showScreen('leaderboard');
            this.loadLeaderboard();
            if (callback) callback();
        });
    }

    onBackToMenu(callback) {
        this.elements.backButton.addEventListener('click', callback);
    }
}

export default GameUI;
