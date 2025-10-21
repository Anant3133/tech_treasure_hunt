# Admin Panel Access

The admin panel is a completely separate interface from the main treasure hunt game.

## Accessing the Admin Panel

**URL:** `http://localhost:3000/admin-panel`

## Admin Registration/Login

1. **Register a new admin account:**
   - Team Name: Choose any admin team name
   - Password: Your secure password
   - Admin Invite Key: `Devcom2025` (from .env file)
   - Click "Register as Admin"

2. **Login with existing admin account:**
   - Enter your admin team name and password
   - Click "Login as Admin"

## Admin Features

### 🔧 QR Codes Tab
- Generate QR codes for any question (1-10)
- QR codes refresh automatically every 60 seconds
- Display QR codes at physical locations for teams to scan

### ❓ Questions Tab
- Create new questions
- Update existing questions
- Delete questions
- View all questions with answers and hints

### 👥 Teams Tab
- View all registered teams
- See team progress (current question)
- Reset team progress back to question 1
- Monitor team completion status

## Important Notes

- Admin panel is completely separate from the main game interface
- Only users with admin role can access admin endpoints
- Admin accounts are created using the `ADMIN_INVITE_KEY` from server environment
- Regular players cannot access admin functionality

## Game Flow

1. **Teams register/login** on main site (`/`)
2. **Teams play the game** (`/game`) 
3. **Teams scan QR codes** generated from admin panel
4. **Teams view leaderboard** (`/leaderboard`)
5. **Admins manage everything** from admin panel (`/admin-panel`)

## Security

- All admin routes require authentication + admin role
- Admin invite key prevents unauthorized admin registration
- JWT tokens are used for session management
- Admin panel has separate authentication flow