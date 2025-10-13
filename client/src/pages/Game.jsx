import { useEffect, useState } from 'react';
import { getQuestion, submitAnswer, resolveQrToken } from '../api/game';
import QRScanner from '../components/QRScanner.jsx';

export default function Game() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

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
      } else if (res.requiresQrScan) {
        setStatus('Answer correct. Please scan the on-site QR to proceed.');
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
      }
    } catch (e) {
      setStatus(e?.response?.data?.message || 'QR resolve failed');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Question {question?.questionNumber || currentQuestion}</h2>
      <p className="mb-4">{question?.text}</p>
      <form onSubmit={onSubmit} className="flex gap-2 mb-4">
        <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border px-3 py-2 flex-1" placeholder="Your answer" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
      </form>
      <div className="space-y-2">
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setShowScanner(true)}>Open Scanner</button>
      </div>
      {showScanner && (
        <QRScanner
          onScan={(text) => handleQrTokenScanned(text)}
          onError={() => {}}
          onClose={() => setShowScanner(false)}
        />
      )}
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
}


