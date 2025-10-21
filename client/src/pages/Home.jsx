import { useState, useEffect } from 'react';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import LocomotiveScroll from 'locomotive-scroll';
import { useAuth } from '../App.jsx';
import { decodeJWT } from '../api/utils';
import LetterGlitch from '../LetterGlitch'; // ✅ Keep background

export default function Home() {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    const scroll = new LocomotiveScroll({
      el: document.querySelector('[data-scroll-container]'),
      smooth: true,
      multiplier: 1.1,
    });
    return () => scroll.destroy();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      let response =
        mode === 'login'
          ? await login(teamName, password)
          : await register({ teamName, password });

      if (response?.token) {
        authLogin(response.token);
        const decoded = decodeJWT(response.token);
        navigate(decoded?.role === 'admin' ? '/admin-panel' : '/start-game');
      } else setError('No token received');
    } catch (e) {
      setError(e?.response?.data?.message || 'Auth failed');
    }
  }

  return (
    <div
      data-scroll-container
      className="relative min-h-screen bg-gradient-to-b from-indigo-600 via-purple-700 to-blue-800 flex flex-col items-center justify-start overflow-x-hidden"
    >
      {/* 🔮 Glitch Background */}
      <div className="absolute inset-0 -z-10">
        <LetterGlitch
          glitchSpeed={45}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
      </div>

      {/* --- Hero / Form Section --- */}
      <section
        data-scroll
        data-scroll-speed="1"
        className="w-full flex flex-col justify-center items-center px-4 pt-20 pb-10 sm:pt-24 sm:pb-14"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all duration-500"
        >
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-4xl font-extrabold text-center text-white mb-3 drop-shadow-md"
          >
            Tech Treasure Hunt
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-white/80 text-sm mb-6"
          >
            Solve. Race. Conquer.
          </motion.p>

          {/* --- Form --- */}
          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <motion.input
              whileFocus={{ scale: 1.03 }}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              className="w-full bg-white/90 border border-gray-200 px-4 py-2.5 rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              required
            />
            <motion.input
              whileFocus={{ scale: 1.03 }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/90 border border-gray-200 px-4 py-2.5 rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              required
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-md shadow-lg tracking-wide transition-all"
            >
              {mode === 'login' ? 'Login' : 'Register'}
            </motion.button>
          </motion.form>

          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-white/80 hover:text-white underline text-xs tracking-wide transition-colors"
            >
              {mode === 'login' ? 'Create new team' : 'Have an account? Login'}
            </button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-3 bg-red-500/20 border border-red-400 text-red-100 text-xs rounded-md p-2 text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* --- Game Rules Section --- */}
      <section
        data-scroll
        data-scroll-speed="0.5"
        className="w-full max-w-3xl px-6 py-12 text-center flex flex-col items-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-white mb-6 drop-shadow-md"
        >
          Game Rules & Info 📜
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {[
            '✅ Register or log in with your team name',
            '📍 Follow the QR clues at each checkpoint',
            '⏳ Fastest team to finish all puzzles wins!',
            '🚫 No skipping or external help allowed',
          ].map((rule, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-white/90 text-sm shadow-sm hover:bg-white/20 transition"
            >
              {rule}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8 text-white/70 text-xs"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p>© 2025 Tech Treasure Hunt. All rights reserved.</p>
        </motion.div>
      </section>
    </div>
  );
}
