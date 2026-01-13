import * as THREE from 'three';
import Bullet from './Bullet.js';

// ----------------------------------------------
// Virtual Gun Index finger act like nozel
// ----------------------------------------------
class HandGun {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.bullets = [];
        this.handPosition = null;
        this.isVisible = false;

        this.createGunModel();
    }

    createGunModel() {
        const geometry = new THREE.ConeGeometry(0.1, 0.5, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,  
            opacity: 0          
        });

        this.gunMesh = new THREE.Mesh(geometry, material);
        this.gunMesh.rotation.x = Math.PI / 2;
        this.gunMesh.visible = true; // Keep visible for calculations
        this.scene.add(this.gunMesh);

        const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0
        });

        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.scene.add(this.muzzleFlash);
    }

    updateHandPosition(handPos) {
        if (!handPos) {
            this.handPosition = null;
            this.gunMesh.visible = false;
            this.isVisible = false;
            return;
        }

        this.isVisible = true;
        this.handPosition = handPos;

       
        const worldPos = this.screenToWorld(handPos.x, handPos.y);

        this.gunMesh.position.copy(worldPos);
        this.gunMesh.visible = true; 
        this.gunMesh.lookAt(this.camera.position);
    }

    screenToWorld(x, y) {
        const worldX = (x - 0.5) * 30;
        const worldY = -(y - 0.5) * 22.5;
        const worldZ = -2;

        return new THREE.Vector3(worldX, worldY, worldZ);
    }

    getScreenPosition() {
        if (!this.isVisible || !this.gunMesh.visible) {
            return null;
        }

        const vector = this.gunMesh.position.clone();
        vector.project(this.camera);

        const x = (vector.x + 1) / 2;
        const y = (-vector.y + 1) / 2;

        return { x, y };
    }

    shoot() {
        if (!this.handPosition) return null;

        const startPos = this.gunMesh.position.clone();
        const vector = new THREE.Vector3(
            (this.handPosition.x - 0.5) * 2,
            -((this.handPosition.y - 0.5) * 2),
            0.5
        );

        vector.unproject(this.camera);
        const direction = vector.sub(this.camera.position).normalize();

        const bullet = new Bullet(this.scene, startPos, direction);
        this.bullets.push(bullet);
        this.triggerMuzzleFlash(startPos);

        return bullet;
    }

    triggerMuzzleFlash(position) {
        this.muzzleFlash.position.copy(position);
        this.muzzleFlash.material.opacity = 1;
        const fadeOut = () => {
            this.muzzleFlash.material.opacity -= 0.1;
            if (this.muzzleFlash.material.opacity > 0) {
                requestAnimationFrame(fadeOut);
            }
        };
        fadeOut();
    }

    update() {
        this.bullets = this.bullets.filter(bullet => bullet.update());
    }

    getBullets() {
        return this.bullets.filter(bullet => bullet.isActive);
    }

    clear() {
        this.bullets.forEach(bullet => bullet.destroy());
        this.bullets = [];
    }
}

export default HandGun;
