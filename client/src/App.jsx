import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import StartGame from './pages/StartGame.jsx'
import Game from './pages/Game.jsx'
import Login from './pages/Login.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Admin from './pages/Admin.jsx'
import { logout } from './api/auth'

function RequireAuth({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function Layout({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const location = window.location.pathname;
  
  // Don't show navbar on home page
  if (location === '/') {
    return children;
  }
  
  if (!token) {
    return children; // No nav for unauthenticated pages
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 flex gap-4 border-b bg-white justify-between items-center shadow-sm">
        <div className="flex gap-4">
          <Link to="/start-game" className="font-semibold hover:text-blue-600 transition-colors">Home</Link>
          <Link to="/game" className="font-semibold hover:text-blue-600 transition-colors">Game</Link>
          <Link to="/leaderboard" className="hover:text-blue-600 transition-colors">Leaderboard</Link>
        </div>
        <button 
          onClick={() => { logout(); window.location.href = '/'; }}
          className="text-red-600 hover:text-red-800 underline transition-colors"
        >
          Logout
        </button>
      </nav>
      <main className="w-full">{children}</main>
    </div>
  );
}

function LoginPage() { return <Login /> }
function LeaderboardPage() { return <Leaderboard /> }
function AdminPage() { return <Admin /> }

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start-game" element={<RequireAuth><StartGame /></RequireAuth>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/game" element={<RequireAuth><Game /></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="*" element={<div>Not found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
