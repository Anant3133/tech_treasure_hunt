# ⚡ Tech Treasure Hunt (Hack n Seek)

A premium, mobile-first **interactive scavenger / puzzle hunt application** built for developer events and team-building competitions. This repository is configured in **Showcase Mode** to allow recruiters and developers to test-drive both participant and admin flows seamlessly directly from the browser.

---

## 🎮 Live Demo & Showcase Mode

When visiting the application, you will see a floating **⚡ Showcase Control Panel** at the bottom-right of your screen. This simulator widget is designed specifically for portfolio review:
*   **Instant Participant Demo**: Click to generate a unique visitor team (e.g., `visitor-4829`) and log in automatically. Your game state will be fully isolated!
*   **Instant Admin Demo**: Log in as a pre-configured admin (`demo-admin` / `password123`) to view live dashboards, rearrange questions via drag-and-drop, and monitor team activities.
*   **On-site QR Simulators**: Bypass the requirement of being physically on-site to scan QR codes. You can simulate answering questions, scanning location QRs, and scanning checkpoint codes directly from the floating control panel.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Three.js, React Router v7, Lucide Icons, Canvas Vortex & Hyperspeed effects |
| **Backend** | Node.js, Express, Firebase Admin (Firestore), JSON Web Tokens (JWT), Cryptographic signatures (`crypto`), Node-Cache |
| **Integrations** | Axios Interceptors, React-QR-Code generator, ZXing Barcode Scanner, Locomotive Scroll |

---

## ✨ Key Features

1.  **JWT-Based Authentication**: Secure team registration and authentication. Custom middleware extracts team roles (participants vs. admins) and manages game session tokens.
2.  **Cryptographic QR Signature System**: To prevent cheating, locations are marked by dynamic QR codes. The backend signs a payload with an HMAC signature (`sha256`) that rotates every 60 seconds. Scanning an outdated or forged QR token is rejected by the server.
3.  **Real-Time Game Progression**: Core gameplay flow includes clue resolution, image previews, dynamic external resources links, checkpoint gates, and automatic page locks.
4.  **Admin Command Center**:
    *   **Question CRUD & Rearranging**: Manage the puzzle database, upload images/links, and reorder questions dynamically using a drag-and-drop interface.
    *   **Real-time Monitoring**: Monitor team progress, active question numbers, completion times, and toggle team execution states (pause/unpause/reset).
    *   **Bulk Registration**: Upload a CSV of team names and automatically generate encrypted logins.
5.  **Gamified UX**: A dark hacker theme featuring responsive layout, micro-interactions, smooth Locomotive scrolling, and premium particle backgrounds.

---

## 📁 Repository Structure

```text
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── api/                # Axios API service wrappers
│   │   ├── components/         # Reusable UI components (Nav, Footer, ShowcasePanel, etc.)
│   │   ├── pages/              # App Pages (Game, AdminPanel, Leaderboard, Home, Checkpoint, etc.)
│   │   └── App.jsx             # React routing & Auth context
├── server/                     # Node.js + Express Backend
│   ├── scripts/                # Database seeding scripts & sample data
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/    # API controllers (game logic, auth, admin, etc.)
│   │   │   ├── middlewares/    # Custom middlewares (JWT authentication, role validation)
│   │   │   └── routes/         # Express routing definitions
│   │   ├── config/             # Firebase SDK configuration
│   │   └── app.js              # Express app initialization
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
*   Node.js (v18+) and npm
*   A Firebase project with Firestore enabled (you can download your service account key from the Firebase Console)

### 2. Backend Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on your environment variables:
    ```env
    PORT=3001
    JWT_SECRET=your_jwt_signing_secret
    ADMIN_INVITE_KEY=any_invite_key_for_registering_admins
    QR_TOKEN_SECRET=your_qr_rotation_secret
    
    # Firebase credentials (JSON config string)
    FIREBASE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
    ```
4.  Run the backend server:
    ```bash
    npm run dev
    ```
    *Note: On startup, the backend automatically seeds the Firestore database with default questions and creates demo accounts (`demo-admin` & `demo-team`) if they are missing.*

### 3. Frontend Setup
1.  Navigate to the client directory:
    ```bash
    cd ../client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file (optional if running on default port `3001`):
    ```env
    VITE_API_BASE_URL=http://localhost:3001/api
    ```
4.  Run the client development server:
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:5173` in your browser.

---

## 🔒 Security Design: Anti-Cheat Mechanism

In a real hunt, players try to bypass checkpoints. To secure progression:
*   **No Spoilers**: The client is only served details of the *current* question. Future questions and answers are kept server-side.
*   **Dynamic Tokens**: Each QR code printed on-site corresponds to a secret token:
    $$\text{Payload} = \text{QuestionNumber} \mathbin{\Vert} \text{TimeSlot} \mathbin{\Vert} \text{TTL}$$
    $$\text{Signature} = \text{HMAC-SHA256}(\text{Payload}, \text{QR\_TOKEN\_SECRET})$$
*   **Time-window Enforcement**: The token is only valid within its active 60-second window, preventing teams from sharing photos of QR codes.
