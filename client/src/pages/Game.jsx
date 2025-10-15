import { useEffect, useState } from 'react';
import { getQuestion, submitAnswer, resolveQrToken } from '../api/game';
import QRScanner from '../components/QRScanner.jsx';

export default function Game() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [hint, setHint] = useState(null);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Question {question?.questionNumber || currentQuestion}
          </h2>
          <p className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
            {question?.text}
          </p>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex gap-4">
              <input 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                className="flex-1 border-2 border-gray-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" 
                placeholder="Your answer" 
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl">
                Submit
              </button>
            </div>
          </form>
        </div>

        {hint && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="font-bold text-yellow-800 mb-2 text-lg">💡 Hint</div>
            <div className="text-yellow-700 text-lg">{hint}</div>
          </div>
        )}

        {showScanner && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📱 Scan QR Code</h3>
            <QRScanner
              modal={false}
              onScan={(text) => handleQrTokenScanned(text)}
              onError={() => {}}
            />
            <p className="text-sm text-gray-600 mt-4 text-center">
              Scan the on-site QR code to advance to the next question.
            </p>
          </div>
        )}

        {status && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
            <p className="text-blue-800 text-lg text-center font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}


