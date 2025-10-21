import { useEffect, useState } from 'react';
import { getQuestion, submitAnswer, resolveQrToken, getTeamProgress } from '../api/game';
import QRScanner from '../components/QRScanner.jsx';
import NavLayout from '../components/NavLayout.jsx';

export default function Game() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [hint, setHint] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    (async () => {
      try {
        const q = await getQuestion(currentQuestion);
        setQuestion(q);
      } catch (e) {
        setStatus(e?.response?.data?.message || 'Failed to load question');
      }
    })();
  }, [currentQuestion]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await submitAnswer(answer);
      if (res.finished) {
        setStatus('Finished!');
        setHint(null);
      } else if (res.requiresQrScan) {
        setStatus('Answer correct. Please scan the on-site QR to proceed.');
        setHint(res.nextHint || null);
        setShowScanner(true);
      } else {
        setCurrentQuestion(res.currentQuestion || currentQuestion);
      }
    } catch (e) {
      setStatus(e?.response?.data?.message || 'Submit failed');
    }
  }

  async function handleQrTokenScanned(token) {
    try {
      const res = await resolveQrToken(token);
      if (res.advanced) {
        setCurrentQuestion(res.currentQuestion);
        setAnswer('');
        setStatus('Advanced to next question');
        setShowScanner(false);
        setHint(null);
      }
    } catch (e) {
      setStatus(e?.response?.data?.message || 'QR resolve failed');
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 mb-6 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Question {question?.questionNumber || currentQuestion}
          </h2>
          <p className="text-lg text-slate-300 mb-8 text-center leading-relaxed">
            {question?.text}
          </p>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex gap-4">
              <input 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                className="flex-1 border-2 border-slate-600 bg-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-slate-400" 
                placeholder="Your answer" 
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl">
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

        {showScanner && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">📱 Scan QR Code</h3>
            <QRScanner
              modal={false}
              onScan={(text) => handleQrTokenScanned(text)}
              onError={() => {}}
            />
            <p className="text-sm text-slate-400 mt-4 text-center">
              Scan the on-site QR code to advance to the next question.
            </p>
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


