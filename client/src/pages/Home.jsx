import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import LocomotiveScroll from 'locomotive-scroll';
import { useAuth } from '../App.jsx';
import { decodeJWT } from '../api/utils';
import Hyperspeed from '../Hyperspeed'; // ✅ Replace LetterGlitch with Hyperspeed
import { getTeamInfo } from '../api/game';
import { FaUsers, FaPhone, FaSignInAlt } from 'react-icons/fa';

export default function Home() {

  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showHyperspeed, setShowHyperspeed] = useState(false);
  const [fetchedTeam, setFetchedTeam] = useState(null);
  const navigate = useNavigate();
  const { login: authLogin, user, isAuthenticated } = useAuth();

  useEffect(() => {
    const scroll = new LocomotiveScroll({
      el: document.querySelector('[data-scroll-container]'),
      smooth: true,
      multiplier: 1.1,
    });
    // Feature-detect WebGL before attempting Hyperspeed; some phones disable
    // WebGL or block contexts until user interaction. We check support first
    // and only enable the canvas mount when available.
    function supportsWebGL() {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } catch (e) { return false; }
    }

    // Delay Hyperspeed render to next tick to ensure DOM is ready
    const t = setTimeout(() => {
      if (supportsWebGL()) {
        console.log('Home: WebGL supported — mounting Hyperspeed');
        setShowHyperspeed(true);
      } else {
        console.warn('Home: WebGL not supported — using CSS fallback');
        setShowHyperspeed(false);
      }
    }, 0);

    // Retry mounting Hyperspeed on visibilitychange, resize or touchstart (mobile browsers sometimes block initial render)
    const tryMount = () => {
      if (!showHyperspeed) {
        // small debounce
        setTimeout(() => setShowHyperspeed(true), 50);
      }
    };
    window.addEventListener('visibilitychange', tryMount);
    window.addEventListener('resize', tryMount);
    window.addEventListener('touchstart', tryMount, { passive: true });

    return () => {
      scroll.destroy();
      clearTimeout(t);
      window.removeEventListener('visibilitychange', tryMount);
      window.removeEventListener('resize', tryMount);
      window.removeEventListener('touchstart', tryMount);
    };
  }, []);

  useEffect(() => {
    // If authenticated, fetch team info and display members
    let mounted = true;
    async function loadTeam() {
      try {
        if (isAuthenticated && user?.teamId) {
          const data = await getTeamInfo();
          if (mounted) setFetchedTeam(data);
        }
      } catch (err) {
        // don't crash the Home page if fetch fails
        console.warn('Failed to fetch team info', err?.response?.data || err?.message || err);
      }
    }
    loadTeam();
    return () => { mounted = false; };
  }, [isAuthenticated, user]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if ((password || '').length < 6) {
      const msg = 'Password must be at least 6 characters';
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      let response = await login(teamName, password);
      if (response?.token) {
        authLogin(response.token);
        toast.success('Login successful');
        const decoded = decodeJWT(response.token);
        navigate(decoded?.role === 'admin' ? '/admin-panel' : '/start-game');
      } else {
        setError('No token received');
        toast.error('No token received');
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Auth failed';
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div
      data-scroll-container
      className="relative min-h-screen bg-black flex flex-col items-center justify-start overflow-x-hidden"
    >
      {/* 🌌 Hyperspeed Background (replaces LetterGlitch) */}
      <div className="absolute inset-0 -z-10">
        {showHyperspeed ? (
          <Hyperspeed
            effectOptions={{
              onSpeedUp: () => {},
              onSlowDown: () => {},
              distortion: 'turbulentDistortion',
              length: 400,
              roadWidth: 10,
              islandWidth: 2,
              lanesPerRoad: 4,
              fov: 90,
              fovSpeedUp: 150,
              speedUp: 2,
              carLightsFade: 0.4,
              totalSideLightSticks: 20,
              lightPairsPerRoadWay: 40,
              shoulderLinesWidthPercentage: 0.05,
              brokenLinesWidthPercentage: 0.1,
              brokenLinesLengthPercentage: 0.5,
              lightStickWidth: [0.12, 0.5],
              lightStickHeight: [1.3, 1.7],
              movingAwaySpeed: [60, 80],
              movingCloserSpeed: [-120, -160],
              carLightsLength: [400 * 0.03, 400 * 0.2],
              carLightsRadius: [0.05, 0.14],
              carWidthPercentage: [0.3, 0.5],
              carShiftX: [-0.8, 0.8],
              carFloorSeparation: [0, 5],
              colors: {
                roadColor: 0x080808,
                islandColor: 0x0a0a0a,
                background: 0x000000,
                shoulderLines: 0xFFFFFF,
                brokenLines: 0xFFFFFF,
                leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
                rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
                sticks: 0x03B3C3,
              }
            }}
          />
        ) : (
          // CSS fallback for devices without WebGL or when Hyperspeed disabled
          <div className="w-full h-full bg-gradient-to-b from-black via-slate-900 to-black" aria-hidden>
            {/* subtle animated gradient */}
            <div className="absolute inset-0 opacity-40 animate-pulse bg-gradient-to-r from-indigo-900 via-black to-slate-900" />
          </div>
        )}
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
            <span className="inline-flex items-center justify-center gap-3">
              <img src="/devcommlogo.png" alt="DevComm logo" className="w-9 h-9 sm:w-11 sm:h-11 rounded-md object-contain" />
              <span>Hack n Seek</span>
            </span>
          </motion.h1>

          {/* Show current logged-in team info (if available) */}
          {fetchedTeam && (
            <div className="mt-2 mb-4 text-left text-sm text-white/90 bg-white/5 border border-white/10 p-3 rounded-lg">
              <div className="font-semibold flex items-center gap-2">
                <FaUsers className="text-indigo-300" />
                Team: <span className="text-indigo-200">{fetchedTeam.teamName || user?.teamName}</span>
              </div>
              <div className="mt-2 text-xs text-slate-200 flex items-center gap-1">
                <FaUsers className="text-xs" /> Members:
              </div>
              <ul className="list-none pl-5 mt-1 text-xs text-slate-100">
                {(fetchedTeam.members || []).map((m, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span>•</span>
                    {m?.name || 'Unnamed'}
                    {m?.contact ? (
                      <span className="flex items-center gap-1 text-slate-300">
                        <FaPhone className="text-xs" /> {m.contact}
                      </span>
                    ) : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-md shadow-lg tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <FaSignInAlt /> Login
            </motion.button>
          </motion.form>

          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-white/70 text-xs">
              Don't have an account? Contact admin to register your team.
            </p>
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
