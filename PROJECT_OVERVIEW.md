# How Tech Treasure Hunt Was Made

## Simple Overview

Tech Treasure Hunt is a web application for running an interactive scavenger hunt or puzzle competition. Teams log in, solve questions, scan QR codes at checkpoints, and compete on a leaderboard. Administrators can create questions, register teams, display QR codes, monitor progress, and pause or reset games.

## How the Project Is Organized

The project is split into two main parts:

- **Client:** The part users see and interact with in their browser.
- **Server:** The part that handles authentication, game rules, question data, team progress, and administrative actions.

There is also a CSV template that helps administrators register multiple teams at once.

## Frontend: The User Interface

The frontend was built with **React** and **Vite**. React components are used to create the pages and interactive elements of the application.

The main frontend responsibilities are:

- Showing the home, login, game, map, checkpoint, completion, and leaderboard pages.
- Managing navigation with React Router.
- Keeping track of the logged-in team with an authentication context.
- Sending requests to the backend through Axios.
- Allowing teams to submit answers and scan QR codes using the device camera.
- Providing an administrator dashboard for managing the event.
- Adding visual effects, animations, notifications, and a dark hacker-style design.

Tailwind CSS and several visual libraries are used to make the interface responsive and visually engaging on both desktop and mobile devices.

## Backend: The Application Logic

The backend was built with **Node.js** and **Express**. It provides API endpoints that the frontend uses to perform actions.

The backend is responsible for:

- Registering and logging in teams.
- Creating secure login tokens with JWT.
- Checking whether a user is a participant or an administrator.
- Providing the current question without exposing future questions.
- Checking submitted answers.
- Updating team progress.
- Handling QR-code validation and checkpoint progression.
- Providing leaderboard and team-management information.
- Creating, updating, deleting, and rearranging questions.
- Supporting bulk team registration from CSV data.

The server is separated into routes, controllers, services, models, middleware, and configuration files. This keeps the API endpoints, business rules, database operations, and security checks organized.

## Data Storage

The project uses **Firebase Firestore** as its database. Firestore stores information such as:

- Teams and team members.
- Login and role information.
- Questions and answers.
- Team progress.
- Checkpoint status.
- Completion times.

Firebase credentials and other sensitive values are supplied through environment variables rather than being written directly into the source code.

## Authentication and Security

Authentication works through JWT tokens:

1. A team logs in through the frontend.
2. The backend verifies the credentials.
3. The backend returns a JWT token.
4. The frontend stores the token locally.
5. Axios automatically sends the token with future API requests.
6. The backend uses middleware to verify the token and restrict protected actions.

The application also includes role-based access so that administrator features are separated from normal participant features.

## QR-Code Game Flow

The main game flow is built around questions and QR codes:

1. A team receives the current question.
2. The team submits an answer.
3. If the answer is correct, the application may require a QR-code scan.
4. The team scans a QR code using the browser camera.
5. The backend validates the QR token.
6. If the token is valid, the team advances to the next question or checkpoint.

The QR system uses short-lived, signed tokens. This helps prevent teams from reusing old QR codes or skipping ahead without visiting the required location.

## Administrator Features

The administrator dashboard acts as the control center for the event. It allows organizers to:

- Create and edit questions.
- Add hints, images, and reference links.
- Delete and drag-and-drop reorder questions.
- Generate temporary QR codes.
- Register individual teams.
- Register many teams from a CSV file.
- View team members and progress.
- View the leaderboard.
- Pause, unpause, or reset teams.
- Download team credentials after bulk registration.

## Starting Data and Demo Mode

The backend includes seed scripts and startup logic for creating sample questions and demo accounts. This makes it easier to test the application without manually entering all the initial data.

The frontend also includes showcase controls so that visitors can try participant and administrator flows without needing to run a real event.

## Running the Project

The frontend and backend are installed and run separately.

### Backend

```bash
cd server
npm install
npm run dev
```

The backend uses environment variables for the port, JWT secret, QR secret, administrator invite key, and Firebase credentials.

### Frontend

```bash
cd client
npm install
npm run dev
```

The frontend normally runs on the Vite development server and connects to the backend through `VITE_API_BASE_URL`.

## In One Sentence

This project was made by combining a React/Vite frontend, a Node/Express API, Firebase data storage, JWT authentication, and QR-code game mechanics into one system for managing and playing a technology-themed team scavenger hunt.
