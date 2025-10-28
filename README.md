# Tech Treasure Hunt

A mobile-first scavenger / puzzle hunt web app built with React + Vite on the frontend and Node.js + Express + Firestore on the backend. Features team registration/login, QR-protected progression, an admin panel for questions and QR generation, and an animated Hyperspeed background.

## Table of contents

- About
- Features
- Tech stack
- Repo structure
- Prerequisites
- Quick start (dev)
- Environment variables
- Seeding the database
- API reference (overview)
- Admin / maintenance
- Deployment notes
- Troubleshooting
- Contributing
- License

---

## About

This project is a full-stack "treasure hunt" application where teams register, solve puzzles, scan QR check-points to advance, and compete on a leaderboard.

The repo contains two main folders:
- `client/` — React + Vite front-end
- `server/` — Express backend with Firestore

---

## Features

- Team register/login with JWT-based auth
- Team member storage (names + contact)
- Game flow with question hints and QR-protected advancement
- Admin panel for question CRUD, QR tokens generation and previews
- Leaderboard
- Hyperspeed animated background (Three.js + postprocessing)
- React-hot-toast notifications

---

## Tech stack

- Frontend: React 18, Vite, Tailwind CSS, Framer Motion, Three.js (Hyperspeed)
- Backend: Node.js, Express, Firebase Admin (Firestore), JSON Web Tokens
- Others: axios, react-hot-toast, node-cache

---

## Repo structure (top-level)

```
ADMIN_GUIDE.md
client/
  package.json
  src/
    App.jsx
    pages/
      Home.jsx
      StartGame.jsx
      Game.jsx
      Leaderboard.jsx
      Admin.jsx
    components/
      NavLayout.jsx
      QRScanner.jsx
    public/
      devcommlogo.png
server/
  package.json
  server.js
  src/
    app.js
    config/
      firebase.js
    api/
      controllers/
      routes/
      services/
  scripts/
    seed-questions.js
    questions.sample.json
```

---

## Prerequisites

- Node.js 18+ (or a current supported LTS)
- npm (or yarn)
- A Firebase project with a service account (for Firestore) or the ability to provide credentials via environment variables

---

## Quick start (development)

Open two terminals: one for server, one for client.

1. Install dependencies

- Server
  ```powershell
  cd server
  npm install
  ```

- Client
  ```powershell
  cd client
  npm install
  ```

2. Run dev servers

- Server
  ```powershell
  cd server
  npm run dev
  ```

- Client
  ```powershell
  cd client
  npm run dev
  ```

Open the client dev URL printed by Vite (usually http://localhost:5173). The client will call the API at the base URL defined by `VITE_API_BASE_URL` (see Env section).

---

## Environment variables

### Server (`server/.env` or environment)

The server uses dotenv (optional) and expects Firebase credentials and a JWT secret. You may either set `FIREBASE_CREDENTIALS_JSON` (a JSON string) or the individual pieces.

Example `.env` (PowerShell-friendly notes below):

```
PORT=3001
JWT_SECRET=replace_with_a_strong_secret
ADMIN_INVITE_KEY=some-admin-key
# Either
FIREBASE_CREDENTIALS_JSON='{"type":"...","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}'

# OR the individual fields:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

PowerShell tip to set single env var temporarily (for dev session):

```powershell
$env:FIREBASE_PROJECT_ID = "my-firebase-project"
$env:FIREBASE_CLIENT_EMAIL = "service-account@my-firebase-project.iam.gserviceaccount.com"
$env:FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----`n...(replace `n with real newline if needed)---END PRIVATE KEY-----"
$env:JWT_SECRET = "super-secret"
npm run dev
```

Alternatively set `FIREBASE_CREDENTIALS_JSON` to the JSON string (replace `\n` in the private_key with actual newlines or keep `\n` and let the server replace them).

Notes:
- `server/src/config/firebase.js` supports `FIREBASE_CREDENTIALS_JSON` or the three individual env vars.
- `JWT_SECRET` must be set for token generation/verification.

### Client

`client` uses Vite and `import.meta.env`:

- `VITE_API_BASE_URL` — optional, default is `http://localhost:3001/api`

Example `.env` in `client/`:

```
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Seeding the database (questions)

A seeding script is provided to populate question data.

From server folder:

```powershell
cd server
node scripts/seed-questions.js scripts/questions.sample.json
```

Alternatively package script:

```powershell
npm run seed:questions
# (depending on package.json this may run the sample script)
```

Check `server/scripts/` for `questions.sample.json` and the seeder.

---

## API reference (overview)

All endpoints are prefixed with `/api` (client default). Key routes:

Auth
- POST /api/auth/register — register a team (body includes teamName, password, members)
- POST /api/auth/login — login (returns JWT)

Game (protected — requires Authorization: Bearer <token>)
- GET /api/game/progress — get current team progress
- GET /api/game/team — get team info (teamName, members) for authenticated team
- POST /api/game/question/:questionNumber — get question (protected)
- POST /api/game/submit-answer — submit an answer (protected)

QR (protected)
- POST /api/qr/resolve/:token — resolve token sent by scanner to advance team (protected)

Leaderboard
- GET /api/leaderboard — list ranked teams

Admin (protected + admin-only)
- GET /api/admin/questions — list questions
- POST /api/admin/questions — upsert (create/update) question
- DELETE /api/admin/questions/:questionNumber — delete by number
- DELETE /api/admin/questions/id/:questionId — delete by id
- GET /api/admin/teams — list teams (admin)
- other QR endpoints: `/api/admin/qr/...` for generating previews and images

Note: check `server/src/api/routes` for the full list.

---

## Admin panel

- Admin access is controlled via JWT role (admin).
- Use the admin invite key / admin account creation flow to create admin users (see ADMIN_GUIDE.md if present).
- Admin panel provides question management and QR generation UI.

---

## Troubleshooting

### Hyperspeed / WebGL rendering black screen on mobile

Symptoms:
- The background renders black or doesn't initialize on mobile or certain browsers.
- Browser console warning: `WARNING: Too many active WebGL contexts. Oldest context will be lost.`

Causes & fixes:
- The Hyperspeed Three.js app can initialize before the container has an effective size (e.g., when layout libraries like locomotive-scroll are still setting up). This can create zero-sized canvas or multiple contexts.
- Fixes in this repo:
  - We added a robust initialization routine in `client/src/Hyperspeed.jsx` that:
    - Waits for the container to have non-zero width/height (uses `ResizeObserver`).
    - Retries when the document becomes visible or on the first touch (some mobile browsers need user interaction to allow certain features).
    - Logs initialization steps to console to help debugging (`Hyperspeed: initializing with size ...`, `Hyperspeed: assets loaded, calling init`, `Hyperspeed: initialized`, `Hyperspeed: disposing appRef`).
    - Ensures cleanup (disposing previous WebGL contexts) on unmount.
- If you still see many contexts:
  - Make sure pages that show Hyperspeed unmount it when navigating away.
  - Limit Hyperspeed on low-end devices (as a fallback, remove or comment out the `<Hyperspeed />` mount in `Home.jsx` or gate it by a `VITE_DISABLE_HYPERSPEED` env flag).
  - Use the console logs added to `Hyperspeed.jsx` to confirm when/where contexts are created.

### 404 when calling `/api/game/team` (deployed)

Symptom:
- Client console shows `GET /api/game/team 404` and the Start Game panel falls back to showing JWT teamName.

Cause:
- The deployed backend may not have the latest routes deployed (the `GET /api/game/team` route is implemented in `server/src/api/routes/game.routes.js` and the controller in `server/src/api/controllers/game.controller.js`).
- If the server doesn't have that file/route, it returns 404.

Fix:
- Redeploy server with latest code changes.
- Check server logs to confirm route is registered and requests are reaching the server.
- On the client, we fall back to the JWT `user.teamName` to ensure the team name still appears even if the endpoint fails.

### Authentication / token issues

- If frontend receives 401 responses, the Axios interceptor automatically removes `auth_token` from localStorage.
- Ensure `JWT_SECRET` on server matches the signing secret used when generating tokens.

---

## Debugging tips

- Frontend console logs:
  - `StartGame: fetching team progress` / `StartGame: got team info`
  - Hyperspeed logs (see troubleshooting above)
- Server logs:
  - Start server: `npm run dev` (nodemon), check console output for errors during Firebase init if credential env vars are missing/incorrect.

---

## Deployment

- Client: can be deployed to Vercel, Netlify, or similar using `client/build` (Vite).
  - Make sure `VITE_API_BASE_URL` points to the server's API.
- Server: Render, Heroku, or any Node hosting.
  - Ensure Firebase credentials are provided as env vars (prefer `FIREBASE_CREDENTIALS_JSON` or the three `FIREBASE_*` fields).
  - Set `JWT_SECRET` and `ADMIN_INVITE_KEY` environment variables.
  - CORS: server includes `cors` and should be configured as needed (check `server/src/app.js`).

---

## Tests

No automated tests included. Consider adding:
- Unit tests for server controllers (jest / supertest)
- End-to-end tests for the frontend flow (Cypress / Playwright)

---

## Contributing

- Fork, create a branch, and submit pull requests.
- Prefers small, focused PRs with clear descriptions and a short testing checklist.
- If changing backend routes or env vars, update this README with instructions.

---

## Useful file pointers

- Client:
  - `client/src/pages/Home.jsx` — landing/login/register, Hyperspeed mount
  - `client/src/pages/StartGame.jsx` — player landing and team panel
  - `client/src/components/NavLayout.jsx` — navbar (centered links)
  - `client/src/Hyperspeed.jsx` — Three.js background (initialization & debug logs)
- Server:
  - `server/src/app.js` — express app
  - `server/src/api/routes/` — API routes
  - `server/src/api/controllers/` — controller logic
  - `server/src/api/services/firestore.service.js` — Firestore helpers
  - `server/scripts/seed-questions.js` — seeding script
  - `server/src/config/firebase.js` — Firebase admin initialization

---

## Contact

If something breaks or you want a walkthrough, open an issue or contact the repository owner/maintainer.

---

## License

Specify your license here (e.g., MIT). If you want me to add a license file, tell me which license you'd like and I can add `LICENSE.md`.
