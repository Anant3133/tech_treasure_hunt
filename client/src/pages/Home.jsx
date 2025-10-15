import { useState, useEffect } from 'react';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import LocomotiveScroll from 'locomotive-scroll';

export default function Home() {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scroll = new LocomotiveScroll({
      el: document.querySelector('[data-scroll-container]'),
      smooth: true,
      multiplier: 1.1,
    });
    return () => {
      scroll.destroy();
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(teamName, password);
      } else {
        await register({ teamName, password });
      }
      navigate('/start-game');
    } catch (e) {
      setError(e?.response?.data?.message || 'Auth failed');
    }
  }

  return (
    <div
      data-scroll-container
      className="min-h-screen bg-gradient-to-b from-indigo-500 via-purple-500 to-blue-500 flex flex-col items-center justify-start overflow-x-hidden"
    >
      {/* --- Hero / Form Section --- */}
      <section
        data-scroll
        data-scroll-speed="1"
        className="w-full flex flex-col justify-center items-center px-5 py-16 md:py-24 max-w-lg"
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="w-full bg-white/15 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2 tracking-wide">
              Tech Treasure Hunt
            </h1>
            <p className="text-white/90 text-sm md:text-base">
              Join the ultimate puzzle race and conquer the clues!
            </p>
          </motion.div>

          <motion.form
            onSubmit={onSubmit}
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.div whileFocus={{ scale: 1.05 }}>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="w-full bg-white/90 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 placeholder-gray-500 shadow-sm"
                required
              />
            </motion.div>
            <motion.div whileFocus={{ scale: 1.05 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/90 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 placeholder-gray-500 shadow-sm"
                required
              />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-semibold px-4 py-3 rounded-lg transition-all shadow-lg"
            >
              {mode === 'login' ? 'Login' : 'Register'}
            </motion.button>
          </motion.form>

          <motion.div
            className="mt-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-white/90 hover:text-white underline text-sm tracking-wide transition-colors"
            >
              {mode === 'login' ? 'Create new team' : 'Have an account? Login'}
            </button>
          </motion.div>

          {error && (
            <motion.div
              className="mt-5 p-3 bg-red-500/20 border border-red-400 rounded-lg backdrop-blur-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-red-100 text-sm text-center">{error}</p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* --- Game Rules Section --- */}
      <section
        data-scroll
        data-scroll-speed="0.5"
        className="w-full max-w-4xl px-6 py-14 md:py-20 text-center flex flex-col items-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-8 drop-shadow-lg"
        >
          Game Rules & Info 📜
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {[
            '✅ Register or log in with your team name',
            '📍 Follow the QR clues at each checkpoint',
            '⏳ Fastest team to finish all puzzles wins!',
            '🚫 No skipping or external help allowed',
          ].map((rule, index) => (
            <motion.div
              key={index}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-white/90 text-base shadow-md hover:bg-white/20 transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {rule}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 text-white/80 text-xs sm:text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>© 2025 Tech Treasure Hunt. All rights reserved.</p>
        </motion.div>
      </section>
    </div>
  );
}
