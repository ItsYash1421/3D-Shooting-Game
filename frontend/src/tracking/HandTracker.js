import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// ---------------------------------------------------
// Used to track the hand movement to use it as Gun
// ---------------------------------------------------
class HandTracker {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        this.handPosition = null;
        this.isFingerGun = false;
        this.isShooting = false;
        this.lastShootTime = 0;
        this.shootCooldown = 300; 

        this.smoothingFactor = 0.9; 
        this.smoothedLandmarks = null;

        this.deadzone = 0.005;

        this.EXTENSION_THRESHOLD = 0.03;
        this.CURL_THRESHOLD = 0.02;
        this.ANGLE_THRESHOLD = 2.6;

        this.lastDrawTime = 0;
        this.DRAW_INTERVAL = 1000 / 30; 

        this.onHandUpdate = null;
        this.onShoot = null;
    }

    async init() {
        try {
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,              
                minDetectionConfidence: 0.8,     
                minTrackingConfidence: 0.75      
            });

            this.hands.onResults(this.onResults.bind(this));
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 960,   
                height: 720   
            });

            await this.camera.start();

            this.canvas.width = 400;  
            this.canvas.height = 300; 

            return true;
        } catch (error) {
            console.error('Error initializing hand tracker:', error);
            return false;
        }
    }

    onResults(results) {
        const now = performance.now();
        if (now - this.lastDrawTime < this.DRAW_INTERVAL) {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                this.processLandmarks(results.multiHandLandmarks[0]);
            } else {
                this.resetHandData();
            }
            return;
        }
        this.lastDrawTime = now;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-this.canvas.width, 0);
        this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.processLandmarks(results.multiHandLandmarks[0]);

            this.drawHand(this.smoothedLandmarks);
        } else {
            this.resetHandData();
        }
    }

    processLandmarks(rawLandmarks) {
        if (!this.smoothedLandmarks) {
            this.smoothedLandmarks = rawLandmarks.map(l => ({ ...l }));
        } else {
            const indexTip = rawLandmarks[8];
            const prevIndexTip = this.smoothedLandmarks[8];

            const velocityX = Math.abs(indexTip.x - prevIndexTip.x);
            const velocityY = Math.abs(indexTip.y - prevIndexTip.y);
            const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

            let adaptiveSmoothingFactor;
            let adaptiveDeadzone;

            if (velocity > 0.02) {
                adaptiveSmoothingFactor = 0.5; 
                adaptiveDeadzone = 0.001;       
            } else if (velocity > 0.01) {
                adaptiveSmoothingFactor = 0.7;
                adaptiveDeadzone = 0.003;
            } else {
               
                adaptiveSmoothingFactor = 0.9;
                adaptiveDeadzone = this.deadzone;
            }

            this.smoothedLandmarks = rawLandmarks.map((l, i) => {
                
                const deltaX = Math.abs(l.x - this.smoothedLandmarks[i].x);
                const deltaY = Math.abs(l.y - this.smoothedLandmarks[i].y);
                const deltaZ = Math.abs(l.z - this.smoothedLandmarks[i].z);

                const useNewX = deltaX > adaptiveDeadzone ? l.x : this.smoothedLandmarks[i].x;
                const useNewY = deltaY > adaptiveDeadzone ? l.y : this.smoothedLandmarks[i].y;
                const useNewZ = deltaZ > adaptiveDeadzone ? l.z : this.smoothedLandmarks[i].z;

                return {
                    x: adaptiveSmoothingFactor * this.smoothedLandmarks[i].x + (1 - adaptiveSmoothingFactor) * useNewX,
                    y: adaptiveSmoothingFactor * this.smoothedLandmarks[i].y + (1 - adaptiveSmoothingFactor) * useNewY,
                    z: adaptiveSmoothingFactor * this.smoothedLandmarks[i].z + (1 - adaptiveSmoothingFactor) * useNewZ,
                };
            });
        }

        this.detectFingerGun(this.smoothedLandmarks);

        const indexTip = this.smoothedLandmarks[8];
        this.handPosition = {
            x: 1 - indexTip.x,
            y: indexTip.y,
            z: indexTip.z
        };

        if (this.onHandUpdate) {
            this.onHandUpdate(this.handPosition, this.isFingerGun);
        }
    }

    resetHandData() {
        this.handPosition = null;
        this.isFingerGun = false;
        this.smoothedLandmarks = null;

        if (this.onHandUpdate) {
            this.onHandUpdate(null, false);
        }
    }

    drawHand(landmarks) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];

        this.ctx.strokeStyle = this.isFingerGun ? '#00ff00' : '#ffffff';
        this.ctx.lineWidth = 2;

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            this.ctx.beginPath();
            this.ctx.moveTo(
                (1 - startPoint.x) * this.canvas.width,
                startPoint.y * this.canvas.height
            );
            this.ctx.lineTo(
                (1 - endPoint.x) * this.canvas.width,
                endPoint.y * this.canvas.height
            );
            this.ctx.stroke();
        });
        this.ctx.fillStyle = this.isFingerGun ? '#00ff00' : '#ffffff';
        landmarks.forEach((landmark) => {
            this.ctx.beginPath();
            this.ctx.arc(
                (1 - landmark.x) * this.canvas.width,
                landmark.y * this.canvas.height,
                3,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
        });
    }

    calculateAngle(a, b, c) {
        const ab = { x: a.x - b.x, y: a.y - b.y };
        const cb = { x: c.x - b.x, y: c.y - b.y };

        const dot = ab.x * cb.x + ab.y * cb.y;
        const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);

        if (mag === 0) return 0;
        return Math.acos(Math.max(-1, Math.min(1, dot / mag)));
    }

    detectFingerGun(landmarks) {
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3];
        const indexTip = landmarks[8];
        const indexPIP = landmarks[6];
        const indexMCP = landmarks[5];
        const middleTip = landmarks[12];
        const middlePIP = landmarks[10];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        // Method 1: Angle-based (most reliable)
        const indexAngle = this.calculateAngle(indexTip, indexPIP, indexMCP);
        const indexExtendedByAngle = indexAngle > 2.4; 

        // Method 2: Y-position check with relaxed tolerance
        const indexExtendedByY = (indexPIP.y - indexTip.y) > 0.02; 

        // Method 3: Check index is higher than middle finger (practical check)
        const indexHigherThanMiddle = indexTip.y < middleTip.y - 0.02;

        // Index is extended if ANY of these methods confirm it
        const indexExtended = indexExtendedByAngle || indexExtendedByY || indexHigherThanMiddle;

        const thumbOkay = true; 

        const notOpenPalm = !(
            middleTip.y < middlePIP.y - 0.05 &&
            ringTip.y < pinkyTip.y - 0.05
        );

        const wasFingerGun = this.isFingerGun;

        this.isFingerGun = indexExtended && thumbOkay && notOpenPalm;

        const now = Date.now();
        if (this.isFingerGun && !wasFingerGun && now - this.lastShootTime > this.shootCooldown) {
            this.isShooting = true;
            this.lastShootTime = now;

            if (this.onShoot) {
                this.onShoot(this.handPosition);
            }
        } else {
            this.isShooting = false;
        }
    }

    getHandPosition() {
        return this.handPosition;
    }

    isFingerGunGesture() {
        return this.isFingerGun;
    }

    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
    }
}

export default HandTracker;
