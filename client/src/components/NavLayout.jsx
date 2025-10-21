import { Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function NavLayout({ children }) {
  const { logout: handleLogout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="p-4 flex gap-4 border-b bg-slate-800 border-slate-700 justify-between items-center shadow-sm">
        <div className="flex gap-4">
          <Link to="/start-game" className="font-semibold text-white hover:text-blue-400 transition-colors">Home</Link>
          <Link to="/game" className="font-semibold text-white hover:text-blue-400 transition-colors">Game</Link>
          <Link to="/leaderboard" className="text-white hover:text-blue-400 transition-colors">Leaderboard</Link>
        </div>
        <button 
          onClick={() => { handleLogout(); }}
          className="text-red-400 hover:text-red-300 underline transition-colors"
        >
          Logout
        </button>
      </nav>
      <main className="w-full min-h-[calc(100vh-80px)]">{children}</main>
    </div>
  );
}