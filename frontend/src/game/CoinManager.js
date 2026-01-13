import * as THREE from 'three';

// ----------------------------------------------
// Used for render the coins on playground
// ----------------------------------------------
class Coin {
    constructor(scene, startPosition, targetPosition, speed = 0.02) {
        this.scene = scene;
        this.speed = speed;
        this.isActive = true;
        this.id = Math.random().toString(36).substr(2, 9);

        const COIN_RADIUS = 0.6; 
        const geometry = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, 0.1, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xFFAA00,
            emissiveIntensity: 0.3
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.userData.coin = this;

        this.direction = new THREE.Vector3()
            .subVectors(targetPosition, startPosition)
            .normalize();

        this.scene.add(this.mesh);
        this.rotationSpeed = 0.05;
    }

    update() {
        if (!this.isActive) return false;

        this.mesh.position.addScaledVector(this.direction, this.speed);
        this.mesh.rotation.z += this.rotationSpeed;

        if (Math.abs(this.mesh.position.x) > 15 ||
            Math.abs(this.mesh.position.y) > 10 ||
            this.mesh.position.z > 5) {
            this.destroy();
            return false;
        }
        return true;
    }

    hit() {
        if (!this.isActive) return;

        this.isActive = false;

        this.createExplosion();

        this.destroy();
    }

    createExplosion() {
        const particleCount = 20;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(this.mesh.position);

            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );

            particle.userData.life = 30;

            this.scene.add(particle);
            particles.push(particle);
        }

        const animateParticles = () => {
            particles.forEach((particle, index) => {
                particle.userData.life--;

                if (particle.userData.life <= 0) {
                    this.scene.remove(particle);
                    particles.splice(index, 1);
                } else {
                    particle.position.add(particle.userData.velocity);
                    particle.userData.velocity.y -= 0.01;
                    particle.material.opacity = particle.userData.life / 30;
                }
            });

            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };

        animateParticles();
    }

    destroy() {
        this.isActive = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

class CoinManager {
    constructor(scene) {
        this.scene = scene;
        this.coins = [];
        this.spawnInterval = 1000; 
        this.lastSpawnTime = 0;
        this.isSpawning = false;
        this.coinsSpawned = 0;
    }

    start() {
        this.isSpawning = true;
        this.lastSpawnTime = Date.now();
    }

    stop() {
        this.isSpawning = false;
    }

    update() {
        this.coins = this.coins.filter(coin => coin.update());
        if (this.isSpawning) {
            const now = Date.now();
            if (now - this.lastSpawnTime > this.spawnInterval) {
                this.spawnCoin();
                this.lastSpawnTime = now;
            }
        }
    }

    spawnCoin() {
        const edge = Math.floor(Math.random() * 4);
        let startPos = new THREE.Vector3();

        const distance = 12;
        const COIN_Z = -2; 

        switch (edge) {
            case 0: 
                startPos.set(
                    (Math.random() - 0.5) * 20,
                    8, 
                    COIN_Z 
                );
                break;
            case 1: 
                startPos.set(
                    distance,
                    (Math.random() - 0.5) * 8, 
                    COIN_Z 
                );
                break;
            case 2:
                startPos.set(
                    (Math.random() - 0.5) * 20,
                    -8,  
                    COIN_Z 
                );
                break;
            case 3: 
                startPos.set(
                    -distance,
                    (Math.random() - 0.5) * 8, 
                    COIN_Z  
                );
                break;
        }
        const targetPos = new THREE.Vector3(
            (Math.random() - 0.5) * 20,  
            (Math.random() - 0.5) * 12, 
            COIN_Z  
        );

        const coin = new Coin(this.scene, startPos, targetPos, 0.03);
        this.coins.push(coin);
        this.coinsSpawned++;
    }

    checkHit(bulletPosition, bulletRadius = 1.0) {  
        for (let i = 0; i < this.coins.length; i++) {
            const coin = this.coins[i];
            if (!coin.isActive) continue;

            const dx = bulletPosition.x - coin.mesh.position.x;
            const dy = bulletPosition.y - coin.mesh.position.y;
            const dz = bulletPosition.z - coin.mesh.position.z;

            const xyDistance = Math.sqrt(dx * dx + dy * dy);

            const zTolerance = 3.0;
            const zInRange = Math.abs(dz) < zTolerance;

            if (xyDistance < bulletRadius + 0.6 && zInRange) { 
                coin.hit();
                this.coins.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    clear() {
        this.coins.forEach(coin => coin.destroy());
        this.coins = [];
    }

    getActiveCoins() {
        return this.coins.filter(coin => coin.isActive);
    }

    getCoinsSpawned() {
        return this.coinsSpawned;
    }

    reset() {
        this.clear();
        this.coinsSpawned = 0;
    }
}

export default CoinManager;
