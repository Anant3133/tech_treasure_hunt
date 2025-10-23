import { Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { motion } from 'framer-motion';

export default function NavLayout({ children }) {
  const { logout: handleLogout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/start-game' },
    { name: 'Game', path: '/game' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navbar */}
      <nav className="p-4 flex justify-between items-center bg-black border-b border-green-500 shadow-lg">
        {/* Logo / Brand */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-neon-green drop-shadow-neon"
        >
          Tech Hunt
        </motion.div>

        {/* Links */}
        <div className="flex gap-8">
          {navLinks.map(link => (
            <motion.div
              key={link.name}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative group"
            >
              <Link
                to={link.path}
                className="text-white font-semibold text-lg hover:text-green-400 transition-colors"
              >
                {link.name}
              </Link>
              {/* Neon underline effect */}
              <span className="absolute left-0 -bottom-1 w-0 h-1 bg-green-400 rounded-full transition-all group-hover:w-full"></span>
            </motion.div>
          ))}
        </div>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.05, textShadow: '0 0 8px #39FF14' }}
          transition={{ duration: 0.3 }}
          className="text-red-400 hover:text-red-300 font-semibold underline"
        >
          Logout
        </motion.button>
      </nav>

      {/* Main Content */}
      <main className="w-full min-h-[calc(100vh-80px)]">{children}</main>
    </div>
  );
}
