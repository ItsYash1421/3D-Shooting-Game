import GameEngine from './core/GameEngine.js';
import HandTracker from './tracking/HandTracker.js';
import GameUI from './ui/GameUI.js';
import soundManager from './utils/soundManager.js';

// ----------------------------------------------
// this was used to show all the screen 
// ----------------------------------------------
class Game {
    constructor() {
        this.ui = new GameUI();
        this.gameEngine = null;
        this.handTracker = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        try {
            this.ui.updateLoadingText('Initializing sound system...');
            soundManager.init();

            this.ui.updateLoadingText('Setting up game engine...');
            const canvas = document.getElementById('game-canvas');
            this.gameEngine = new GameEngine(canvas);

            this.ui.updateLoadingText('Initializing hand tracking...');
            const video = document.getElementById('video');
            const handCanvas = document.getElementById('hand-canvas');
            this.handTracker = new HandTracker(video, handCanvas);

            await this.handTracker.init();

            this.ui.updateLoadingText('Ready!');

            this.setupEventListeners();

            this.setupHandTracking();

            this.setupGameCallbacks();

            this.isInitialized = true;

            setTimeout(() => {
                this.ui.showScreen('start');
            }, 500);

        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.updateLoadingText('Error: ' + error.message);

            setTimeout(() => {
                this.ui.showScreen('start');
            }, 2000);
        }
    }

    setupEventListeners() {
        this.ui.onStartGame(() => this.startGame());
        this.ui.onPlayAgain(() => this.startGame());
        this.ui.onMainMenu(() => this.ui.showScreen('start'));
        this.ui.onBackToMenu(() => this.ui.showScreen('start'));
        this.ui.onShowLeaderboard(() => { });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameEngine && this.gameEngine.gameState === 'playing') {
                e.preventDefault();
                this.gameEngine.shoot();
            }
        });

        const gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) {
            gameCanvas.addEventListener('click', () => {
                if (this.gameEngine && this.gameEngine.gameState === 'playing') {
                    this.gameEngine.shoot();
                }
            });
        }
    }

    setupHandTracking() {
        if (!this.handTracker) return;

        this.handTracker.onHandUpdate = (handPos, isFingerGun) => {
            if (this.gameEngine) {
                this.gameEngine.updateHandPosition(handPos, isFingerGun);
                this.ui.updateGestureStatus(handPos !== null, isFingerGun);

                const gunScreenPos = this.gameEngine.getGunScreenPosition();
                this.ui.updateCrosshairPosition(gunScreenPos || handPos);
            }
        };

        this.handTracker.onShoot = (handPos) => {
            if (this.gameEngine && this.gameEngine.gameState === 'playing') {
                this.gameEngine.shoot();
            }
        };
    }

    setupGameCallbacks() {
        if (!this.gameEngine) return;

        this.gameEngine.onScoreUpdate = (score, hits) => {
            this.ui.updateScore(score);
            this.ui.updateHits(hits);
        };

        this.gameEngine.onTimeUpdate = (time) => {
            this.ui.updateTimer(time);
        };

        this.gameEngine.onGameOver = async (stats, coinsSpawned) => {
            await this.ui.showGameOver(stats, coinsSpawned, this.gameEngine.getScoreManager());
        };
    }

    startGame() {
        const playerName = this.ui.getPlayerName();

        this.ui.updateScore(0);
        this.ui.updateHits(0);
        this.ui.updateTimer(90);

        this.ui.showScreen('game');

        if (this.gameEngine) {
            this.gameEngine.startGame(playerName);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
