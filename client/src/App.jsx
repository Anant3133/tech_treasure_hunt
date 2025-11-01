import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import Completion from './pages/Completion.jsx';
import { useState, useEffect, createContext, useContext } from 'react'
import './App.css'
import Home from './pages/Home.jsx'
import StartGame from './pages/StartGame.jsx'
import Game from './pages/Game.jsx'
import Login from './pages/Login.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Maps from './pages/Maps.jsx'
import { logout } from './api/auth'
import api from './api/http'
import { decodeJWT } from './api/utils'

// Auth Context
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Decode JWT to get user info
      const decoded = decodeJWT(token);
      
      // Verify token by making a request to a protected endpoint
      const response = await api.get('/game/progress');
      setIsAuthenticated(true);
      setUser({ 
        token, 
        teamId: decoded?.teamId,
        teamName: decoded?.teamName,
        role: decoded?.role || 'participant'
      });
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token) => {
    localStorage.setItem('auth_token', token);
    const decoded = decodeJWT(token);
    setIsAuthenticated(true);
    setUser({ 
      token,
      teamId: decoded?.teamId,
      teamName: decoded?.teamName,
      role: decoded?.role || 'participant'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    logout(); // Call the existing logout function
  };

  // Wake up backend on app mount (prevent Render cold starts)
  const wakeUpBackend = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      // Don't use /api prefix for health endpoint
      await fetch(`${baseURL}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      console.log('[Backend] Wake-up ping successful');
    } catch (error) {
      // Silent fail - don't block app if backend is slow/down
      console.log('[Backend] Wake-up ping failed (this is okay):', error.message);
    }
  };

  useEffect(() => {
    // Ping backend first to wake it up
    wakeUpBackend();
    // Then check auth
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      login,
      logout: handleLogout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Export the useAuth hook for use in other components
export { useAuth };

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/start-game" replace />;
  }

  return children;
}

function Layout({ children }) {
  return children; // Let individual route components handle their own layout needs
}

function LoginPage() { return <Login /> }
function LeaderboardPage() { return <Leaderboard /> }

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<RedirectIfAuthenticated><Home /></RedirectIfAuthenticated>} />
            <Route path="/start-game" element={<RequireAuth><StartGame /></RequireAuth>} />
            <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
            <Route path="/game" element={<RequireAuth><Game /></RequireAuth>} />
            <Route path="/maps" element={<RequireAuth><Maps /></RequireAuth>} />
            <Route path="/completion" element={<RequireAuth><Completion /></RequireAuth>} />
            <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="*" element={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Page not found</div>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
