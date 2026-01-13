import * as THREE from 'three';

// ------------------------------------------------
// Bullet object which was fired from the crosshair
// ------------------------------------------------
class Bullet {
    constructor(scene, startPosition, direction) {
        this.scene = scene;
        this.speed = 0.5;
        this.isActive = true;
        this.lifetime = 100;
        this.age = 0;

        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);

        this.trail = [];
        this.maxTrailLength = 5;

        this.direction = direction.clone().normalize();
        this.scene.add(this.mesh);
    }

    update() {
        if (!this.isActive) return false;

        this.age++;
        this.mesh.position.addScaledVector(this.direction, this.speed);

        this.updateTrail();

        if (this.age > this.lifetime) {
            this.destroy();
            return false;
        }
        if (Math.abs(this.mesh.position.x) > 20 ||
            Math.abs(this.mesh.position.y) > 15 ||
            Math.abs(this.mesh.position.z) > 10) {
            this.destroy();
            return false;
        }

        return true;
    }

    updateTrail() {
        this.trail.push(this.mesh.position.clone());

        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    getPosition() {
        return this.mesh.position.clone();
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

export default Bullet;
