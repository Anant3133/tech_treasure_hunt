# How Tech Treasure Hunt Was Made

## Project Overview

Tech Treasure Hunt is a full-stack web application for running an interactive scavenger hunt or puzzle competition. Teams authenticate through the application, receive questions, submit answers, scan QR codes at checkpoints, track their progress, and compete on a leaderboard.

The system is designed around three main concerns:

- **Participant experience:** solving challenges and progressing through the hunt.
- **Game logic:** validating answers, QR codes, checkpoints, and team progress.
- **Event administration:** managing questions, teams, QR codes, and live standings.

## High-Level Architecture

The project uses a client-server architecture:

```text
React/Vite client
        │
        │ HTTP requests with Axios
        ▼
Node.js/Express server
        │
        │ Firebase Admin SDK / Firestore operations
        ▼
Firebase Firestore database
```

The frontend is responsible for presentation and user interaction. The backend exposes REST-style API endpoints and contains the core application logic. Firestore provides document-based data storage for teams, questions, progress, and event state.

## Project Organization

The codebase is divided into a client application, a server application, and supporting data files.

```text
tech_treasure_hunt/
├── client/                 React/Vite frontend
│   ├── pages/              Main participant and admin screens
│   ├── components/         Reusable UI elements
│   ├── context/            Shared authentication and application state
│   ├── services/           API request helpers
│   └── assets/             Images, styles, and other frontend resources
├── server/                 Node.js/Express backend
│   ├── routes/             HTTP endpoint definitions
│   ├── controllers/        Request and response handling
│   ├── services/           Game and administrative business logic
│   ├── models/             Firestore data access and data structures
│   ├── middleware/         Authentication, authorization, and validation
│   └── config/             Environment and Firebase configuration
└── CSV templates/          Bulk team registration input files
```

The exact filenames may vary, but the architectural roles are separated so that routing, business logic, database access, and security responsibilities are not placed in one large file.

## Frontend: React and Vite

The frontend is a single-page application built with **React** and **Vite**.

### Main frontend responsibilities

- Render the home, login, game, map, checkpoint, completion, and leaderboard views.
- Use **React Router** to switch between pages without full browser reloads.
- Use an authentication context to share the current team, user role, and login state across components.
- Use **Axios** to communicate with backend API endpoints.
- Submit answers and display feedback from the server.
- Access the device camera for QR-code scanning.
- Provide administrative screens for managing questions, teams, and event progress.
- Display responsive layouts, notifications, animations, and visual effects.

React components provide reusable pieces of the interface, while page components combine those pieces into complete application screens. Tailwind CSS and visual libraries are used for responsive styling and the application's dark, technology-focused design.

## Backend: Node.js and Express

The backend runs on **Node.js** using the **Express** web framework. It acts as the API layer between the frontend and Firestore.

### Main backend responsibilities

- Register and authenticate teams.
- Issue and validate **JSON Web Tokens (JWTs)**.
- Apply role-based authorization for participants and administrators.
- Return only the question and game state that a team is currently allowed to see.
- Validate submitted answers.
- Update team progress and checkpoint status.
- Validate QR-code tokens and prevent invalid progression.
- Calculate and return leaderboard information.
- Manage questions, hints, images, links, and question order.
- Register teams individually or in bulk from CSV data.
- Pause, reset, or update team participation state.

The backend follows a layered structure:

```text
Route
  → Controller
    → Service / business logic
      → Firestore data access
        → Response to the client
```

- **Routes** define URLs and HTTP methods.
- **Controllers** read request data and send HTTP responses.
- **Services** contain the main game and administration rules.
- **Models or data-access modules** interact with Firestore.
- **Middleware** performs authentication, authorization, validation, and shared request processing.

This separation makes the server easier to extend and reduces the amount of game logic inside route definitions.

## Firestore Data Storage

The project uses **Firebase Firestore**, a document-oriented NoSQL database. Instead of storing data in relational tables, the application stores related records as collections and documents.

The database stores information such as:

- Team accounts and team members.
- User roles and authentication-related data.
- Questions, answers, hints, images, and checkpoint requirements.
- Team progress and the current question or stage.
- QR-code and checkpoint state.
- Completion timestamps and leaderboard data.

The server uses Firebase configuration and credentials through environment variables. This keeps secrets out of the source code and allows different settings for development and deployment environments.

## Authentication and Authorization

Authentication uses **JWT-based access tokens**.

The typical login flow is:

1. A team submits login credentials through the React client.
2. The Express API verifies the credentials.
3. The server creates a signed JWT containing the relevant identity and role information.
4. The client stores the token for the active session.
5. Axios includes the token in the `Authorization` header for protected requests.
6. Authentication middleware verifies the token before allowing access.
7. Authorization middleware checks whether the user is a participant or administrator.

This creates a distinction between authentication and authorization:

- **Authentication:** Who is making the request?
- **Authorization:** What is that user allowed to do?

Administrator endpoints are protected separately from normal participant endpoints so that teams cannot modify questions, reset progress, or access event-management tools.

## Core Game Workflow

The game is driven by a sequence of questions, answers, and checkpoints.

```text
Team logs in
    ↓
Server returns the current question
    ↓
Team submits an answer
    ↓
Server validates the answer
    ↓
QR scan may be required
    ↓
Server validates the QR token
    ↓
Team progresses to the next question or checkpoint
    ↓
Leaderboard data is updated
```

The server is responsible for enforcing progression rules. The frontend displays the current state, but it should not be trusted to decide whether a team has actually earned access to the next stage.

## QR-Code Checkpoints

QR scanning is implemented as part of the checkpoint system. The frontend uses the browser camera to capture a QR value, then sends that value to the backend.

The backend checks whether the QR token is valid for the team's current stage. The QR system uses signed and short-lived tokens so that a code cannot easily be reused or modified.

This prevents common game-flow problems such as:

- Skipping questions or checkpoints.
- Reusing an expired QR code.
- Submitting a QR code intended for another stage.
- Advancing without completing the required answer.

The important security decision is that QR validation and progression are handled on the server rather than only in React.

## Administrator Dashboard

The administrator dashboard is the control center for running an event.

It provides functionality for:

- Creating and editing questions.
- Adding hints, images, and reference links.
- Deleting and reordering questions.
- Generating temporary QR codes.
- Registering individual teams.
- Importing multiple teams from a CSV file.
- Viewing team members and progress.
- Monitoring the leaderboard.
- Pausing, unpausing, or resetting teams.
- Downloading generated team credentials after bulk registration.

These features use protected admin API routes so that management actions are not available to normal participants.

## Bulk Team Registration

The CSV workflow allows administrators to create multiple teams from a structured file rather than entering each team manually.

The general process is:

1. An administrator uploads or supplies a CSV file using the expected format.
2. The backend parses the rows and validates required fields.
3. Team and member records are created in Firestore.
4. Login credentials or registration results are returned to the administrator.
5. The credentials can be downloaded for distribution to teams.

This is useful when many teams need to be created before an event begins.

## Seed Data and Demo Mode

The server includes seed or startup logic for creating sample questions and demo accounts. This gives developers a predictable starting point when testing the application locally.

The frontend also includes showcase or demo controls that allow visitors to explore participant and administrator flows without setting up a complete live competition.

## Configuration and Environment Variables

Configuration is supplied through environment variables rather than hard-coded values. Important settings include:

- Server port.
- JWT signing secret.
- QR-token signing secret.
- Administrator invite or setup key.
- Firebase project credentials.
- Frontend API base URL.

The client uses `VITE_API_BASE_URL` to determine where API requests should be sent. The server uses its own environment variables for authentication, Firebase access, and runtime configuration.

## Running the Project

The client and server are installed and started separately.

### Start the backend

```bash
cd server
npm install
npm run dev
```

The backend requires its environment variables and Firebase configuration before it can access Firestore.

### Start the frontend

```bash
cd client
npm install
npm run dev
```

The Vite development server starts the React application and connects to the backend through `VITE_API_BASE_URL`.

## In One Sentence

Tech Treasure Hunt was built as a full-stack, client-server system that combines a React/Vite single-page frontend, a Node.js/Express REST API, Firebase Firestore storage, JWT authentication, role-based authorization, and server-validated QR-code game mechanics.
