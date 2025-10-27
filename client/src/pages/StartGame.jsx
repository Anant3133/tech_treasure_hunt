import { useEffect, useState } from 'react';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { getTeamProgress } from '../api/game';
import NavLayout from '../components/NavLayout.jsx';
import Footer from '../components/Footer.jsx';

export default function StartGame() {
  const navigate = useNavigate();
  const [teamProgress, setTeamProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const progress = await getTeamProgress();
        setTeamProgress(progress);
      } catch (error) {
        console.error('Failed to fetch team progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

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
      <div className="relative overflow-hidden bg-black text-green-400 min-h-screen flex flex-col items-center justify-center px-6 py-16">
        
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
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

          {/* Buttons */}
          {!loading && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              {isFinished ? (
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="px-8 py-4 text-lg font-bold rounded-xl border border-green-500 text-green-300 bg-black hover:bg-green-500/10 transition-all duration-200 shadow-[0_0_15px_#00ff99] hover:shadow-[0_0_25px_#00ff99] hover:scale-105"
                >
                  🏆 View Leaderboard
                </button>
              ) : (
                <button
                  onClick={handleStartGame}
                  className="px-8 py-4 text-lg font-bold rounded-xl border border-green-500 text-green-300 bg-black hover:bg-green-500/10 transition-all duration-200 shadow-[0_0_15px_#00ff99] hover:shadow-[0_0_25px_#00ff99] hover:scale-105"
                >
                  {hasStarted ? '▶ Continue Hunt' : '🚀 Start Game'}
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
        <h2 className="text-3xl font-bold text-center mb-12 tracking-wider text-green-400 drop-shadow-[0_0_10px_#00ff99]">
          How It Works 🧠
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: '🧩',
              title: 'Solve Puzzles',
              desc: 'Crack riddles and decrypt clues. Each mission brings you closer to victory!',
            },
            {
              icon: '📱',
              title: 'Scan QR Codes',
              desc: 'Authenticate progress with QR checkpoints. Unlock secret hints as you go.',
            },
            {
              icon: '🏆',
              title: 'Race to Victory',
              desc: 'Compete with rival teams. The fastest hacker to complete all missions wins!',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-black/60 border border-green-500/40 rounded-2xl p-8 text-center shadow-[0_0_15px_#00ff99] hover:shadow-[0_0_30px_#00ff99] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-4 animate-bounce">{card.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-green-400">{card.title}</h3>
              <p className="text-green-300 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-b from-black via-gray-900 to-black text-green-300 border-t border-green-500/20 py-16">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-wider text-green-400 drop-shadow-[0_0_10px_#00ff99]">
          Pro Tips 💡
        </h2>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          {[
            ['⚡', 'Collaborate efficiently — your team is your biggest weapon.'],
            ['🔍', 'Read every clue carefully. Think beyond the obvious.'],
            ['📱', 'Keep your phone charged. Dead battery = Game Over.'],
            ['⏰', 'Time is critical — don’t waste a second.'],
            ['🎯', 'Use hints wisely — they might be your lifeline.'],
            ['🏃', 'Stay sharp, stay fast. Every second counts.'],
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
      <div className="bg-black text-center py-6 ">
        <p className="text-green-500 text-sm tracking-widest uppercase animate-pulse">
          Good luck, Agent. May your code be flawless. 🧠
        </p>
        
      </div>
      
      
    </NavLayout>
    </main>
    <Footer/>
  </div>

    
  );
}
