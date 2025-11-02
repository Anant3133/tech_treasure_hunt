import { useEffect, useState } from 'react';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { getTeamProgress } from '../api/game';
import NavLayout from '../components/NavLayout.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../App.jsx';
import { getTeamInfo } from '../api/game';
import { FaUsers, FaPhone, FaPlay, FaCheckCircle, FaTrophy, FaClock, FaRunning } from 'react-icons/fa';
import { GiBrain } from "react-icons/gi";
import { IoExtensionPuzzleSharp } from "react-icons/io5";
import { CiMobile1 } from "react-icons/ci";
import { BsTrophyFill } from "react-icons/bs";
import { PiLightbulbFilamentFill } from "react-icons/pi";
import { AiTwotoneThunderbolt } from "react-icons/ai";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { GiBullseye } from "react-icons/gi";
export default function StartGame() {
  const navigate = useNavigate();
  const [teamProgress, setTeamProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchedTeam, setFetchedTeam] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        console.log('StartGame: fetching team progress');
        const progress = await getTeamProgress();
        console.log('StartGame: progress', progress);
        setTeamProgress(progress);
      } catch (error) {
        console.error('Failed to fetch team progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadTeam() {
      const token = localStorage.getItem('auth_token');
      console.log('StartGame: loadTeam start, user=', user, 'isAuthenticated=', isAuthenticated, 'tokenPresent=', Boolean(token));
      try {
        if (isAuthenticated && user?.teamId) {
          const info = await getTeamInfo();
          console.log('StartGame: got team info', info);
          if (mounted) setFetchedTeam(info);
        }
      } catch (err) {
        console.warn('Failed to fetch team info on StartGame', err?.response?.data || err?.message || err);
        // If the endpoint is missing (404) or token is not accepted, fall back to JWT teamName if available
        const status = err?.response?.status;
        if (status === 404) {
          console.warn('StartGame: /game/team returned 404 - falling back to JWT teamName');
        }
        if (mounted) setFetchedTeam({ teamName: user?.teamName || null, members: [] });
      }
    }
    loadTeam();
    return () => { mounted = false; };
  }, [isAuthenticated, user]);

  function handleStartGame() {
    navigate('/game');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const hasStarted = teamProgress?.hasStarted;
  const isFinished = teamProgress?.finishTime !== null;

  return (
    <div className="relative min-h-screen bg-black text-green-400 flex flex-col">
      <main className="flex-grow pb-24">
      <NavLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-black text-green-400 min-h-screen flex flex-col items-center justify-center h-screen">
        
        {/* Background matrix animation */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,100,0.15),transparent)] animate-pulse"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')]"></div>

        {/* Main content */}
        <div className="relative max-w-3xl text-center z-10">
          {loading ? (
            <div className="text-center animate-pulse">
              <h1 className="text-5xl font-bold text-green-400 mb-4 tracking-wider">
                Loading...
              </h1>
              <div className="animate-spin rounded-full h-12 w-12 border-b-5 border-green-400 mx-auto"></div>
            </div>
          ) : isFinished ? (
            <>
              <h1 className="text-5xl font-extrabold mb-4 text-green-400 drop-shadow-[0_0_15px_#00ff99] animate-flicker">
                🏆 Hunt Complete!
              </h1>
              <p className="text-lg md:text-xl text-green-300 max-w-2xl mx-auto leading-relaxed">
                Congratulations, Agent! You’ve completed all {teamProgress?.currentQuestion || 1} missions. Check the leaderboard to see your rank.
              </p>
            </>
          ) : hasStarted ? (
            <>
              <h1 className="text-5xl font-extrabold mb-4 text-green-400 drop-shadow-[0_0_10px_#00ff99] animate-fadein">
                Continue Your Hunt ⚡
              </h1>
              <p className="text-lg md:text-xl text-green-300 max-w-2xl mx-auto leading-relaxed">
                You’re on mission {teamProgress?.currentQuestion || 1}. Keep decoding clues and chase the treasure!
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-extrabold mb-4 text-green-400 drop-shadow-[0_0_10px_#00ff99] animate-fadein">
                Ready to Hunt? 🕶️
              </h1>
              <p className="text-lg md:text-xl text-green-300 max-w-2xl mx-auto leading-relaxed">
                Solve encrypted puzzles, scan QR checkpoints, and outsmart the clock.
              </p>
            </>
          )}

          {/* Team Info - shown when available */}
          {(fetchedTeam || user?.teamName) && (
            <div className="mt-10 mb-8 text-left text-sm bg-gradient-to-br from-black/60 via-gray-900/40 to-black/60 border border-green-400/20 p-6 rounded-2xl max-w-xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.15)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(rgba(20, 220, 80, 0.25)] animate-fadein">
            <div className="font-semibold text-lg text-green-300 flex items-center gap-2">
              <FaUsers className="text-emerald-400/90" />
              <span className="text-emerald-400/90">Team:</span>
              <span className="text-green-100 font-bold tracking-wide">
                {(fetchedTeam && fetchedTeam.teamName) || user?.teamName}
              </span>
            </div>
          
            <div className="mt-4 text-xs uppercase text-green-400/70 tracking-wider flex items-center gap-1">
              <FaUsers className="text-sm" /> Members
            </div>
            <ul className="list-none pl-5 mt-2 space-y-1 text-sm text-green-100/90">
              {((fetchedTeam && fetchedTeam.members) || []).map((m, idx) => (
                <li key={idx} className="hover:text-emerald-300 transition-colors duration-200 flex items-center gap-2">
                  <span>•</span>
                  <span>{m?.name || 'Unnamed'}</span>
                  {m?.contact ? (
                    <span className="text-green-400/70 flex items-center gap-1">
                      <FaPhone className="text-xs" /> {m.contact}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          
          )}

          {/* Buttons */}
          {!loading && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              {isFinished ? (
                <button
                  onClick={() => navigate('/completion')}
                  className="px-8 py-4 text-lg font-bold rounded-xl border border-yellow-500 text-yellow-300 bg-black hover:bg-yellow-500/10 transition-all duration-200 shadow-[0_0_15px_#ffdd00] hover:shadow-[0_0_25px_#ffdd00] hover:scale-105 flex items-center gap-2"
                >
                  <FaCheckCircle /> Hunt Completed
                </button>
              ) : (
                <button
                  onClick={handleStartGame}
                  className="px-8 py-4 text-lg font-bold rounded-xl border border-green-500 text-green-300 bg-black hover:bg-green-500/10 transition-all duration-200 shadow-[0_0_15px_#00ff99] hover:shadow-[0_0_25px_#00ff99] hover:scale-105 flex items-center gap-2"
                >
                  <FaPlay /> {hasStarted ? 'Continue Hunt' : 'Start Game'}
                </button>
              )}

              {/* <button
                onClick={handleLogout}
                className="px-6 py-3 rounded-lg font-semibold border border-red-500 text-red-400 bg-black hover:bg-red-500/10 transition-all duration-200 hover:scale-105 shadow-[0_0_10px_#ff0055] hover:shadow-[0_0_20px_#ff0055]"
              >
                Logout
              </button> */} 
            </div>
          )}
        </div>
      </div>

      {/* Game Info Cards */}
      <div className="bg-black py-16 px-6 text-green-300">
        <h2 className="text-3xl font-bold text-center mb-12 tracking-wider text-green-400 drop-shadow-[0_0_10px_#00ff99] flex items-center justify-center gap-3">
        <GiBrain className="text-4xl text-green-400 drop-shadow-[0_0_50px_#ff4fd8] relative -top-1" />
        How It Works 
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
    {[
      {
        icon: (
          <IoExtensionPuzzleSharp className="text-5xl text-pink-400 drop-shadow-[0_0_25px_#ff4fd8] animate-bounce" />
        ),
        title: "Solve Puzzles",
        desc: "Crack riddles and decrypt clues. Each mission brings you closer to victory!",
      },
      {
        icon: <CiMobile1  className="text-5xl text-green-400 drop-shadow-[0_0_25px_#ff4fd8] animate-bounce"/>,
        title: "Scan QR Codes",
        desc: "Authenticate progress with QR checkpoints. Unlock secret hints as you go.",
      },
      {
        icon: <BsTrophyFill className="text-5xl text-yellow-400 drop-shadow-[0_0_25px_#ff4fd8] animate-bounce" />,
        title: "Race to Victory",
        desc: "Compete with rival teams. The fastest hacker to complete all missions wins!",
      },
    ].map((card, i) => (
      <div
        key={i}
        className="bg-black/60 border border-green-500/40 rounded-2xl p-8 text-center shadow-[0_0_15px_#00ff99] hover:shadow-[0_0_30px_#00ff99] hover:-translate-y-1 transition-all duration-300"
      >
        <div className="flex justify-center mb-4">{card.icon}</div>
        <h3 className="text-xl font-bold mb-2 text-green-400">{card.title}</h3>
        <p className="text-green-300 text-sm leading-relaxed">{card.desc}</p>
      </div>
    ))}
  </div>
</div>


      {/* Tips Section */}
      <div className="bg-black py-16 px-6 text-green-300">
        <h2 className="text-3xl font-bold text-center mb-12 tracking-wider text-green-400 drop-shadow-[0_0_50px_#00ff99] flex items-center justify-center gap-3">
          Pro Tips <PiLightbulbFilamentFill className='text-4xl text-yellow-400 drop-shadow-[0_0_20px_#00ff99] relative -top-1 '/>
        </h2>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          {[
            [<AiTwotoneThunderbolt />, 'Collaborate efficiently — your team is your biggest weapon.'],
            [<FaMagnifyingGlass />, 'Read every clue carefully. Think beyond the obvious.'],
            [ <CiMobile1 />, 'Keep your phone charged. Dead battery = Game Over.'],
            [<FaClock />, 'Time is critical — don’t waste a second.'],
            [<GiBullseye /> ,'Use hints wisely — they might be your lifeline.'],
            [<FaRunning />, 'Stay sharp, stay fast. Every second counts.'],
          ].map(([icon, text], i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-black/40 border border-green-500/20 p-4 rounded-xl hover:shadow-[0_0_15px_#00ff99] transition-all duration-300"
            >
              <span className="text-green-400 text-xl">{icon}</span>
              <p className="text-sm md:text-base">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black text-center py-6 flex justify-center mb-3 ">
        <p className="flex items-center gap-2 text-green-500 text-sm tracking-widest uppercase animate-pulse">
          Good luck, Agent. May your code be flawless. <GiBrain className='text-2xl text-green-400 drop-shadow-[0_0_50px_#00ff99] relative -top-1'/>
        </p>
        
      </div>
      
      
    </NavLayout>
    </main>
    <Footer/>
  </div>

    
  );
}
