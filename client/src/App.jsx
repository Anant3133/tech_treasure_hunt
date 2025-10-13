import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import './App.css'
import Game from './pages/Game.jsx'
import Login from './pages/Login.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Admin from './pages/Admin.jsx'

function RequireAuth({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 flex gap-4 border-b bg-white">
        <Link to="/game" className="font-semibold">Game</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <main className="p-4 max-w-3xl mx-auto">{children}</main>
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
          <Route path="/" element={<Navigate to="/game" replace />} />
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
