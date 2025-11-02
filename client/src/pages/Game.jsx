import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestion, submitAnswer, resolveQrToken, getTeamProgress } from '../api/game';
import QRScanner from '../components/QRScanner.jsx';
import NavLayout from '../components/NavLayout.jsx';
import Footer from '../components/Footer.jsx';
import Checkpoint from './Checkpoint.jsx';
import { FaLightbulb, FaPaperPlane, FaQrcode, FaTimes, FaSpinner, FaPause } from 'react-icons/fa';


export default function Game() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerActive = useRef(false);
  const [hint, setHint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [canScan, setCanScan] = useState(false); // Only allow scanning after correct answer
  const [isPaused, setIsPaused] = useState(false);
  const [awaitingCheckpoint, setAwaitingCheckpoint] = useState(null);

  // Load team progress on mount
  useEffect(() => {
    const loadTeamProgress = async () => {
      try {
        const progress = await getTeamProgress();
        if (progress.finishTime) {
          navigate('/completion');
          return;
        }
        setCurrentQuestion(progress.currentQuestion || 1);
        setIsPaused(progress.isPaused || false);
        setAwaitingCheckpoint(progress.awaitingCheckpoint || null);
      } catch (e) {
        setStatus('Failed to load team progress');
        setCurrentQuestion(1); // fallback
      } finally {
        setLoading(false);
      }
    };

    loadTeamProgress();
  }, []);

  // Load question when currentQuestion changes
  useEffect(() => {
    if (!currentQuestion) return;
    setQuestionLoading(true);
    (async () => {
      try {
        const q = await getQuestion(currentQuestion);
        setQuestion(q);
      } catch (e) {
        setStatus(e?.response?.data?.message || 'Failed to load question');
      } finally {
        setQuestionLoading(false);
      }
    })();
  }, [currentQuestion]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setCanScan(false);
    try {
      const res = await submitAnswer(answer);
      if (res.finished) {
        navigate('/completion');
        return;
      } else if (res.requiresCheckpoint) {
        // Redirect to checkpoint page
        setAwaitingCheckpoint(res.checkpointNumber);
        return;
      } else if (res.requiresQrScan) {
        setStatus('Answer correct. Please scan the on-site QR to proceed.');
        setHint(res.nextHint || null);
        setCanScan(true);
        setShowScanner(false);
      } else {
        setCurrentQuestion(res.currentQuestion || currentQuestion);
      }
    } catch (e) {
      setStatus(e?.response?.data?.message || 'Submit failed');
    }
  }

  async function handleQrTokenScanned(token) {
    if (scannerActive.current) return; // Prevent double scan
    scannerActive.current = true;
    try {
      const res = await resolveQrToken(token);
      if (res.advanced) {
        setQuestion(null); // Clear old question to force reload
        setCurrentQuestion(res.currentQuestion); // This triggers useEffect to load the new question
        setAnswer('');
        setStatus(null); // Clear any previous status message
        setShowScanner(false);
        setHint(null);
        setCanScan(false)
      }
    } catch (e) {
      setStatus(e?.response?.data?.message || 'QR resolve failed');
    } finally {
      setTimeout(() => { scannerActive.current = false; }, 1000); // allow scanning again after 1s
    }
  }

  if (loading) {
    return (
      <NavLayout>
        <div className="min-h-screen bg-gradient-to-br from-black/90 via-green-900/40 to-black/90 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading your progress...</p>
          </div>
        </div>
      </NavLayout>
    );
  }

  // If awaiting checkpoint, show checkpoint page
  if (awaitingCheckpoint) {
    return <Checkpoint checkpointNumber={awaitingCheckpoint} />;
  }

  // If game is paused, show paused screen
  if (isPaused) {
    return (
      <NavLayout>
        <div className="min-h-screen bg-gradient-to-br from-black via-yellow-900/30 to-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-br from-yellow-900/40 to-black/60 backdrop-blur-sm border border-yellow-500 rounded-2xl p-8 text-center shadow-2xl">
            <FaPause className="text-6xl text-yellow-400 mx-auto mb-6 animate-pulse" />
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">Game Paused</h1>
            <p className="text-lg text-slate-300 mb-6">
              Your game is currently paused. Please wait for the admin to unpause it.
            </p>
            <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/30">
              <p className="text-sm text-slate-400">
                You can refresh this page to check if the game has been unpaused.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </NavLayout>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-green-400 flex flex-col">
      <main className="flex-grow pb-24">
      <NavLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
  <div className="bg-black/70 backdrop-blur-md rounded-3xl shadow-[0_0_30px_#22ff8844] border border-green-400/30 p-6 sm:p-8 mb-6">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-green-400 mb-6 text-center drop-shadow-[0_0_10px_#39ff14]">
            Question {question?.questionNumber || currentQuestion}
          </h2>
          
          <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 text-center leading-relaxed break-words">
            {question?.text}
          </p>

          {/* Question Image */}
          {question?.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img 
                src={question.imageUrl} 
                alt="Question visual" 
                className="max-w-full max-h-96 rounded-xl border-2 border-green-400/30 shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.error('Failed to load image:', question.imageUrl);
                }}
              />
            </div>
          )}

          {/* Question Links */}
          {question?.links && question.links.length > 0 && (
            <div className="mb-6 bg-slate-800/50 border border-green-400/30 rounded-xl p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                🔗 Reference Links:
              </h3>
              <div className="space-y-2">
                {question.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-400 hover:text-blue-300 underline transition-colors text-sm sm:text-base"
                  >
                    → {link.text}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <input 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                className="w-full sm:flex-1 border-2 border-slate-600 bg-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg placeholder-slate-400" 
                placeholder="Your answer" 
                autoComplete="off"
              />
              <button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-black px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-[0_0_15px_rgba(20,255,50,0.6)] hover:shadow-[0_0_30px_rgba(15,230,50,0.9)] transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2">
                <FaPaperPlane /> Submit
              </button>
            </div>
          </form>
        </div>

        {hint && (
          <div className="bg-yellow-900/30 border-2 border-yellow-600 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="font-bold text-yellow-400 mb-2 text-lg flex items-center gap-2">
              <FaLightbulb className="text-xl" /> Hint
            </div>
            <div className="text-yellow-300 text-lg">{hint}</div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
          {!showScanner && canScan && (
            <button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
              onClick={() => setShowScanner(true)}
            >
              <FaQrcode /> Start Scanning
            </button>
          )}
          {showScanner && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 text-center flex items-center justify-center gap-2">
                <FaQrcode /> Scan QR Code
              </h3>
              <QRScanner
                modal={false}
                onScan={handleQrTokenScanned}
                onError={() => setShowScanner(false)}
                onClose={() => setShowScanner(false)}
              />
              <button
                className="mt-3 sm:mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                onClick={() => setShowScanner(false)}
              >
                <FaTimes /> Close Scanner
              </button>
              <p className="text-xs sm:text-sm text-slate-400 mt-3 sm:mt-4 text-center">
                Scan the on-site QR code to advance to the next question.
              </p>
            </div>
          )}
        </div>

        {questionLoading && (
          <div className="flex justify-center items-center py-6">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-400 mr-3" />
            <span className="text-blue-300 text-lg">Loading question...</span>
          </div>
        )}
        {status && (
          <div className="bg-blue-900/30 border-2 border-blue-600 rounded-2xl p-6 shadow-lg">
            <p className="text-blue-300 text-lg text-center font-medium">{status}</p>
          </div>
        )}
        
      </div>
      
      
    </NavLayout>

      </main>
      <Footer/>
    </div>
    
  );
}


