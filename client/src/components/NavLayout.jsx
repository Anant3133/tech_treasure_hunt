import { Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function NavLayout({ children }) {
  const { logout: handleLogout } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/start-game' },
    { name: 'Game', path: '/game' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navbar */}
      <nav className="p-4 bg-black border-b border-green-500 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto relative">
          {/* Left: Logo / Brand - Extreme Left */}
          <div className="flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold text-neon-green drop-shadow-neon"
            >
              Hack n Seek
            </motion.div>
          </div>

          {/* Center: Links - Absolute Center */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 gap-8">
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
                <span className="absolute left-0 -bottom-1 w-0 h-1 bg-green-400 rounded-full transition-all group-hover:w-full"></span>
              </motion.div>
            ))}
          </div>

          {/* Right: Logout Button (Desktop) + Mobile Hamburger - Extreme Right */}
          <div className="flex items-center gap-4">
            {/* Logout Button - Desktop only */}
            <motion.button 
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button" 
            className="hidden md:block text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800">
              Logout
            </motion.button>
            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-md bg-white/5"
                aria-label="Open menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`md:hidden bg-black/80 p-4 ${open ? 'block' : 'hidden'}`}>
        <div className="flex flex-col gap-3">
          {navLinks.map(link => (
            <Link key={link.name} to={link.path} className="text-white font-semibold py-2 border-b border-slate-700">{link.name}</Link>
          ))}
          <button 
            onClick={handleLogout} 
            className="mt-2 text-red-400 hover:text-red-300 font-semibold py-2 border-b border-slate-700 text-left"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full min-h-[calc(100vh-80px)]">{children}</main>
    </div>
  );
}
