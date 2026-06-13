import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import api from '../api/http';
import { login as loginApi, register } from '../api/auth';
import { resolveQrToken, getTeamProgress } from '../api/game';
import { scanCheckpoint } from '../api/checkpoint';
import toast from 'react-hot-toast';
import {
  FaTerminal,
  FaWrench,
  FaPlay,
  FaUser,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaUndo,
  FaArrowRight,
  FaSignOutAlt,
  FaLaptopCode,
  FaKey
} from 'react-icons/fa';

export default function ShowcasePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, login: authLogin, logout } = useAuth();

  // Load team progress and dynamic answer when logged in on game paths to show stateful guide
  const loadProgress = async () => {
    if (!isAuthenticated || user?.role === 'admin') {
      setProgress(null);
      setCurrentAnswer('');
      return;
    }
    try {
      const data = await getTeamProgress();
      setProgress(data);

      // If team is active on a question, fetch the answer
      if (location.pathname === '/game' && !data.awaitingCheckpoint && !data.isPaused && !data.awaitingQrScanForQuestion) {
        const ansRes = await api.get('/showcase/answer');
        setCurrentAnswer(ansRes.data.answer);
      } else {
        setCurrentAnswer('');
      }
    } catch (e) {
      console.warn('Failed to load progress in showcase panel:', e);
      setCurrentAnswer('');
    }
  };

  useEffect(() => {
    loadProgress();
    // Set up a brief polling when active on the game page
    let interval;
    if (isAuthenticated && location.pathname === '/game') {
      interval = setInterval(loadProgress, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  const registerDemoTeam = async () => {
    setLoading(true);
    try {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const teamName = `demo-visitor-${randomId}`;
      const password = 'password123';
      const members = [
        { name: 'Showcase Recruiter', contact: '0000000000' },
        { name: 'Showcase Guest', contact: '1111111111' }
      ];

      const response = await register({ teamName, password, members });
      if (response?.token) {
        authLogin(response.token);
        toast.success(`Logged in as fresh team: ${teamName}`);
        navigate('/start-game');
      }
    } catch (error) {
      console.error('Demo registration failed:', error);
      toast.error('Failed to create visitor team. Verify server is running.');
    } finally {
      setLoading(false);
    }
  };

  const loginDemoAdmin = async () => {
    setLoading(true);
    try {
      const response = await loginApi('demo-admin', 'password123');
      if (response?.token) {
        authLogin(response.token);
        toast.success('Logged in as Demo Admin!');
        navigate('/admin-panel');
        // Force reload after navigation to sync AdminPanel's local mount state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('Demo admin login failed:', error);
      toast.error('Admin login failed. Ensure server database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const simulateQrScan = async () => {
    setLoading(true);
    try {
      // 1. Fetch current valid dynamic token from showcase endpoint
      const res = await api.get('/showcase/qr-token');
      const token = res.data.token;

      // 2. Resolve token on the normal QR validator endpoint
      const resolveRes = await resolveQrToken(token);
      if (resolveRes.advanced) {
        toast.success('QR Code simulated and signature verified. Next question loaded!');
        await loadProgress();
        window.location.reload();
      }
    } catch (error) {
      console.error('QR scan simulation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to simulate QR scan.');
    } finally {
      setLoading(false);
    }
  };

  const simulateCheckpointScan = async () => {
    const cp = progress?.awaitingCheckpoint;
    if (!cp) {
      toast.error('No checkpoint scan is expected.');
      return;
    }
    setLoading(true);
    try {
      await scanCheckpoint(cp);
      toast.success(`Simulated Checkpoint ${cp} Scan! Game paused.`);
      await loadProgress();
      window.location.reload();
    } catch (error) {
      console.error('Checkpoint simulation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to simulate checkpoint scan.');
    } finally {
      setLoading(false);
    }
  };

  const simulateUnpause = async () => {
    setLoading(true);
    try {
      await api.post('/showcase/unpause');
      toast.success('Admin unpause simulated! The game is now resumed.');
      await loadProgress();
      window.location.reload();
    } catch (error) {
      console.error('Unpause simulation failed:', error);
      toast.error('Failed to unpause game.');
    } finally {
      setLoading(false);
    }
  };

  const simulateReset = async () => {
    setLoading(true);
    try {
      await api.post('/showcase/reset');
      toast.success('Progress reset back to Question 1!');
      await loadProgress();
      navigate('/game');
      window.location.reload();
    } catch (error) {
      console.error('Reset simulation failed:', error);
      toast.error('Failed to reset progress.');
    } finally {
      setLoading(false);
    }
  };

  const getPageGuide = () => {
    switch (location.pathname) {
      case '/':
      case '/login':
        return (
          <>
            <p className="mb-2">This is the <strong>landing/login page</strong>. In a live hunt, participant teams use this screen to sign in.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
              <li>Click <strong>Team Demo</strong> to spawn an isolated visitor team and start the game.</li>
              <li>Click <strong>Admin Demo</strong> to jump straight into the administration command center.</li>
            </ul>
          </>
        );
      case '/start-game':
        return (
          <>
            <p className="mb-2">This is the <strong>lobby/rules page</strong>. Your team has authenticated successfully.</p>
            <p className="text-sm text-slate-300">Review the rules on the screen and click "Start Game" on the main card to load your first puzzle.</p>
          </>
        );
      case '/game':
        if (progress?.awaitingCheckpoint) {
          return (
            <>
              <p className="mb-2">You are at a <strong>Checkpoint Gate</strong> (Checkpoint {progress.awaitingCheckpoint}).</p>
              <p className="mb-2 text-sm text-slate-300">In the physical event, players return to the starting base and scan a stationary checkpoint QR code, which triggers a pause.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                <li>Click <strong>Simulate Checkpoint Scan</strong> to scan the code virtually and advance.</li>
              </ul>
            </>
          );
        }
        if (progress?.isPaused) {
          return (
            <>
              <p className="mb-2">Your game is <strong>Paused</strong> at a checkpoint.</p>
              <p className="mb-2 text-sm text-slate-300">Organizers use checkpoints to pause teams to align schedules, double-check answers, or give announcements. An admin must unpause you to continue.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                <li>Click <strong>Simulate Admin Unpause</strong> below to resume playing instantly.</li>
                <li>Or, click <strong>Switch to Admin Panel</strong> to open the admin panel and manually unpause your team!</li>
              </ul>
            </>
          );
        }
        if (progress?.awaitingQrScanForQuestion) {
          return (
            <>
              <p className="mb-2">You are on the <strong>Location Verification step</strong>.</p>
              <p className="mb-2 text-sm text-slate-300">Correct answer submitted! To prevent skipping landmarks, players must locate and scan the dynamic QR code posted at the clue's site.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                <li>Click <strong>Simulate Question QR Scan</strong> below to generate a valid time-slotted cryptographic token and bypass the scanner.</li>
              </ul>
            </>
          );
        }
        return (
          <>
            <p className="mb-2">You are in the <strong>active gameplay area</strong>.</p>
            <p className="mb-3 text-sm text-slate-300">Solve the puzzle displayed. Note that future questions are kept server-side to prevent client inspections.</p>
            
            {currentAnswer && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 text-center my-3.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span className="text-slate-400 block text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5 font-bold">
                  <FaKey className="text-emerald-400 text-xs" /> Clue Answer
                </span>
                <strong className="text-emerald-300 text-lg sm:text-xl font-mono">"{currentAnswer}"</strong>
              </div>
            )}
            <p className="text-xs text-slate-400 italic text-center mt-1">Copy the clue answer and submit it in the game field on the left.</p>
          </>
        );
      case '/completion':
        return (
          <>
            <p className="mb-2">You reached the <strong>Completion Screen</strong>! 🎉</p>
            <p className="text-sm text-slate-300">All questions solved and checkpoints cleared. Your completion timestamp is recorded, locking your leaderboard ranking. Click "Reset Team Progress" to play again.</p>
          </>
        );
      case '/leaderboard':
        return (
          <>
            <p className="mb-2">This is the <strong>Real-time Leaderboard</strong>.</p>
            <p className="text-sm text-slate-300">Ranks teams dynamically based on completed status, current question index, and time of correct answers. Updates instantly as teams advance.</p>
          </>
        );
      case '/admin-panel':
        return (
          <>
            <p className="mb-2">This is the <strong>Admin Command Center</strong>.</p>
            <p className="text-sm text-slate-300">Allows event organizers to generate dynamic QR signatures, rearrange questions via drag-and-drop, pause/unpause/reset players, and bulk register teams via CSV uploads.</p>
          </>
        );
      default:
        return <p>Interactive walkthrough is ready. Navigate to any route to view guidance.</p>;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* 🚀 Collapsed Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-4 px-7 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all duration-300 border border-emerald-400/30 group text-base sm:text-lg"
        >
          <FaWrench className="text-xl group-hover:rotate-45 transition-transform duration-300" />
          <span>Showcase Controls</span>
        </button>
      )}

      {/* 🔮 Expanded Glassmorphic Sidebar */}
      {isOpen && (
        <div className="w-[360px] sm:w-[440px] max-h-[85vh] bg-slate-950/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 flex justify-between items-center">
            <h3 className="font-bold text-emerald-400 text-lg sm:text-xl flex items-center gap-2.5">
              <FaLaptopCode className="text-2xl" />
              <span>Showcase Simulator</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes size={22} />
            </button>
          </div>

          {/* Panel Scroll Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow">
            
            {/* 1. Account Details */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 text-sm">
              <div className="font-bold text-slate-300 mb-2 uppercase tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
                <FaUser className="text-emerald-400 text-sm" /> Session Status
              </div>
              {isAuthenticated ? (
                <div className="space-y-1.5">
                  <p className="text-slate-200">
                    Logged in: <strong className="text-emerald-400 font-mono text-sm sm:text-base">{user?.teamName}</strong>
                  </p>
                  <p className="text-slate-300">
                    Role: <strong className="text-blue-400 font-mono capitalize text-sm sm:text-base">{user?.role}</strong>
                  </p>
                  {progress && (
                    <p className="text-slate-300">
                      Progress: <strong className="text-yellow-400 font-mono text-sm sm:text-base">Q{progress.currentQuestion}</strong>
                      {progress.awaitingCheckpoint && <span className="ml-1.5 text-yellow-500 font-semibold text-xs">(Checkpoint Gate)</span>}
                      {progress.isPaused && <span className="ml-1.5 text-red-500 font-semibold text-xs">(Paused)</span>}
                      {progress.awaitingQrScanForQuestion && <span className="ml-1.5 text-orange-400 font-semibold text-xs">(Awaiting QR)</span>}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-sm">No active session. Please log in.</p>
              )}
            </div>

            {/* 2. Page Guide */}
            <div className="bg-emerald-950/20 rounded-xl p-4 sm:p-5 border border-emerald-500/20 text-sm leading-relaxed text-slate-100">
              <h4 className="font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5 text-sm sm:text-base">
                <FaInfoCircle /> Current View Walkthrough
              </h4>
              {getPageGuide()}
            </div>

            {/* 3. Action Controllers */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-400">Simulator Actions</h4>
              
              {/* Login Actions (Visible when not authenticated) */}
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={registerDemoTeam}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <FaPlay className="text-xs" /> Team Demo
                  </button>
                  {location.pathname !== '/admin-panel' ? (
                    <button
                      onClick={() => navigate('/admin-panel')}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FaTerminal className="text-xs" /> Admin Demo
                    </button>
                  ) : (
                    <button
                      onClick={loginDemoAdmin}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FaTerminal className="text-xs" /> Login as Admin
                    </button>
                  )}
                </div>
              )}

              {/* Game Specific Actions */}
              {isAuthenticated && user?.role === 'participant' && location.pathname === '/game' && (
                <div className="space-y-2.5">
                  {/* QR Scan Action */}
                  {progress?.awaitingQrScanForQuestion && (
                    <button
                      onClick={simulateQrScan}
                      disabled={loading}
                      className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    >
                      <FaArrowRight /> Simulate Question QR Scan
                    </button>
                  )}

                  {/* Checkpoint Scan Action */}
                  {progress?.awaitingCheckpoint && (
                    <button
                      onClick={simulateCheckpointScan}
                      disabled={loading}
                      className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FaCheckCircle /> Simulate Checkpoint Scan
                    </button>
                  )}

                  {/* Admin Unpause Action */}
                  {progress?.isPaused && (
                    <button
                      onClick={simulateUnpause}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FaPlay /> Simulate Admin Unpause
                    </button>
                  )}

                  {/* Reset Progress Action */}
                  <button
                    onClick={simulateReset}
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-sm"
                  >
                    <FaUndo /> Reset My Team Progress
                  </button>
                </div>
              )}

              {/* Leaderboard/Completion Route Actions */}
              {isAuthenticated && user?.role === 'participant' && location.pathname !== '/game' && (
                <div className="space-y-2.5">
                  <button
                    onClick={() => navigate('/game')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <FaPlay /> Go to Game Board
                  </button>
                  <button
                    onClick={simulateReset}
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-slate-700"
                  >
                    <FaUndo /> Reset Team Progress
                  </button>
                </div>
              )}

              {/* Admin Panel Action shortcut */}
              {isAuthenticated && user?.role === 'participant' && (
                <button
                  onClick={loginDemoAdmin}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <FaTerminal /> Switch to Admin Panel
                </button>
              )}

              {/* Admin Panel Specific Actions */}
              {isAuthenticated && user?.role === 'admin' && (
                <div className="space-y-2.5">
                  <button
                    onClick={registerDemoTeam}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <FaPlay /> Create & Log In Demo Team
                  </button>
                </div>
              )}

              {/* Logout Action */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-950/40 hover:bg-red-900/40 text-red-400 text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-red-500/20 shadow-sm"
                >
                  <FaSignOutAlt /> Sign Out / Exit Demo
                </button>
              )}
            </div>

            {/* 4. Tech Badges */}
            <div className="pt-3 border-t border-slate-850 space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Project Tech Stack</h4>
              <div className="flex flex-wrap gap-1.5">
                {['React 18', 'Vite', 'Express', 'Firebase', 'JWT Auth', 'HMAC-SHA256', 'Canvas Particles', 'Three.js'].map(tech => (
                  <span key={tech} className="bg-slate-900 text-slate-350 font-mono text-xs px-2.5 py-1 rounded border border-slate-800">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
