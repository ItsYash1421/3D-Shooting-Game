import * as THREE from 'three';
import CoinManager from '../game/CoinManager.js';
import HandGun from '../game/HandGun.js';
import ScoreManager from '../game/ScoreManager.js';
import soundManager from '../utils/soundManager.js';


// ----------------------------------------------
// Gameengine to manage states and update objects
// Initialize whole enviroment
// ----------------------------------------------
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRunning = false;
        this.isPaused = false;

        this.gameState = 'menu';
        this.roundDuration = 90; 
        this.timeRemaining = this.roundDuration;
        this.lastTime = 0;

        this.scoreManager = new ScoreManager();
        this.initThree();

        this.coinManager = new CoinManager(this.scene);
        this.handGun = new HandGun(this.scene, this.camera);

        this.onScoreUpdate = null;
        this.onTimeUpdate = null;
        this.onGameOver = null;
    }

    initThree() {
       
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.addLights();
        this.addBackground();
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xff00ff, 1, 20);
        pointLight1.position.set(-5, 5, -5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00ffff, 1, 20);
        pointLight2.position.set(5, -5, -5);
        this.scene.add(pointLight2);
    }

    addBackground() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        this.stars = stars;

        const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        gridHelper.position.z = -10;
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add(gridHelper);
    }

    startGame(playerName) {
        this.scoreManager.setPlayerName(playerName);
        this.scoreManager.reset();
        this.timeRemaining = this.roundDuration;
        this.lastTime = Date.now();
        this.gameState = 'playing';
        this.isRunning = true;

        this.coinManager.reset();
        this.coinManager.start();
        this.handGun.clear();
        this.animate();
    }

    updateHandPosition(handPos, isFingerGun) {
        this.handGun.updateHandPosition(handPos);
    }

    getGunScreenPosition() {
        return this.handGun.getScreenPosition();
    }

    shoot() {
        if (this.gameState !== 'playing') return;

        const bullet = this.handGun.shoot();
        if (bullet) {
            soundManager.play('shoot');
            this.scoreManager.addMiss();
        }
    }

    update() {
        if (!this.isRunning || this.isPaused || this.gameState !== 'playing') return;

        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.timeRemaining -= deltaTime;

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
            return;
        }

        if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.ceil(this.timeRemaining));
        }

        this.coinManager.update();
        this.handGun.update();

        const bullets = this.handGun.getBullets();
        bullets.forEach(bullet => {
            if (this.coinManager.checkHit(bullet.getPosition())) {
                bullet.destroy();
                this.scoreManager.addHit(100);
                this.scoreManager.addMiss(-1); 
                soundManager.play('hit');

                if (this.onScoreUpdate) {
                    this.onScoreUpdate(this.scoreManager.getScore(), this.scoreManager.getHits());
                }
            }
        });

        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(this.animate.bind(this));

        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    async endGame() {
        this.isRunning = false;
        this.gameState = 'gameover';
        this.coinManager.stop();

        const stats = this.scoreManager.getStats();
        const coinsSpawned = this.coinManager.getCoinsSpawned();

        if (this.onGameOver) {
            this.onGameOver(stats, coinsSpawned);
        }
    }

    pauseGame() {
        this.isPaused = true;
    }

    resumeGame() {
        this.isPaused = false;
        this.lastTime = Date.now();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getScoreManager() {
        return this.scoreManager;
    }

    destroy() {
        this.isRunning = false;
        window.removeEventListener('resize', this.onWindowResize);
        this.coinManager.clear();
        this.handGun.clear();
    }
}

export default GameEngine;
