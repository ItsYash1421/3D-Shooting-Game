# AR HAND SHOOTER | 3D GESTURE GAME

 That game turns your hand into a weapon. Built with advanced computer vision and 3D rendering technology.

## 🎯 MISSION BRIEFING
Use your hand gestures to aim and shoot floating targets in a 3D space. No mouse, no keyboard—just you and your webcam.

**Real-time Hand Tracking • 3D Physics • Global Leaderboards**

## 🎮 CONTROLS
| Gesture | Action |
| :--- | :--- |
| **Index Finger Point** | **AIM** (Control the crosshair) |
| **Thumb UP** | **READY** (Safety Mode) |
| **Thumb DOWN** | **FIRE** (Hammer Down / Shoot) |

## 🚀 KEY FEATURES
*   **Advanced Hand Tracking**: Powered by MediaPipe with custom adaptive smoothing algorithms for jitter-free aiming.
*   **Gesture Recognition System**: Custom logic to detect "Thumb Fire" vs "Index Point" instantly.
*   **Cyberpunk UI**: A fully immersive, non-intrusive HUD with neon aesthetics.
*   **Global Economy**: Coin collection system with reliable hit detection (Z-depth tolerance).
*   **Backend Integration**: Live leaderboard and session tracking using MongoDB.

## 🛠️ TECH ARSENAL

**FRONTEND** (Client Side)
*   **Three.js**: High-performance 3D rendering engine.
*   **MediaPipe Hands**: Real-time hand landmark detection.
*   **Vite**: Next-gen frontend tooling.
*   **Vanilla CSS**: Custom Cyberpunk design system (Glassmorphism, Neon Glows).

**BACKEND** (Server Side)
*   **Node.js & Express**: High-speed REST API.
*   **MongoDB & Mongoose**: Scalable data storage for scores and users.

## ⚡ DEPLOYMENT / SETUP

### Prerequisites
*   Node.js (v14+)
*   Webcam

### QUICK START

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ItsYash1421/3D-Shooting-Game.git
    cd 3D-Shooting-Game
    ```

2.  **Initialize Backend**
    ```bash
    cd backend
    npm install
    # Create a .env file with your MONGODB_URI
    npm start
    ```

3.  **Initialize Frontend** (New Terminal)
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Engage**
    Open `http://localhost:5173` and allow camera access.

---
*Developed by Yash Kumar Meena*
