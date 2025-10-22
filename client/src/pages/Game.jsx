import { useEffect, useState, useRef } from 'react';
import { getQuestion, submitAnswer, resolveQrToken, getTeamProgress } from '../api/game';
import QRScanner from '../components/QRScanner.jsx';
import NavLayout from '../components/NavLayout.jsx';

export default function Game() {
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

  // Load team progress on mount
  useEffect(() => {
    const loadTeamProgress = async () => {
      try {
        const progress = await getTeamProgress();
        if (progress.finishTime) {
          setStatus('🏆 You have completed the treasure hunt! Check the leaderboard.');
          setLoading(false);
          return;
        }
        setCurrentQuestion(progress.currentQuestion || 1);
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
        setStatus('Finished!');
        setHint(null);
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
        setStatus('Advanced to next question');
        setShowScanner(false);
        setHint(null);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading your progress...</p>
          </div>
        </div>
      </NavLayout>
    );
  }

  return (
    <NavLayout>
      <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-slate-700">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
            Question {question?.questionNumber || currentQuestion}
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 text-center leading-relaxed break-words">
            {question?.text}
          </p>
          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <input 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                className="w-full sm:flex-1 border-2 border-slate-600 bg-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg placeholder-slate-400" 
                placeholder="Your answer" 
                autoComplete="off"
              />
              <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl whitespace-nowrap">
                Submit
              </button>
            </div>
          </form>
        </div>

        {hint && (
          <div className="bg-yellow-900/30 border-2 border-yellow-600 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="font-bold text-yellow-400 mb-2 text-lg">💡 Hint</div>
            <div className="text-yellow-300 text-lg">{hint}</div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
          {!showScanner && canScan && (
            <button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
              onClick={() => setShowScanner(true)}
            >
              Start Scanning
            </button>
          )}
          {showScanner && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 text-center">📱 Scan QR Code</h3>
              <QRScanner
                modal={false}
                onScan={handleQrTokenScanned}
                onError={() => setShowScanner(false)}
                onClose={() => setShowScanner(false)}
              />
              <button
                className="mt-3 sm:mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                onClick={() => setShowScanner(false)}
              >
                Close Scanner
              </button>
              <p className="text-xs sm:text-sm text-slate-400 mt-3 sm:mt-4 text-center">
                Scan the on-site QR code to advance to the next question.
              </p>
            </div>
          )}
        </div>

        {questionLoading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
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
  );
}


