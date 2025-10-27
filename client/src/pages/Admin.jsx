import { useEffect, useState } from 'react';
import { getCurrentQrToken } from '../api/admin';
import QRCode from 'react-qr-code';
import Footer from'../components/Footer.jsx';

export default function Admin() {
  const [questionNumber, setQuestionNumber] = useState(1);
  const [token, setToken] = useState('');
  const [ttl, setTtl] = useState(60);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let intervalId;
    async function fetchToken() {
      try {
        const data = await getCurrentQrToken(questionNumber);
        if (!mounted) return;
        setToken(data.token);
        setTtl(data.ttlSeconds || 60);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to fetch token');
      }
    }
    fetchToken();
    intervalId = setInterval(fetchToken, 5000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, [questionNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black border border-slate-700 rounded-2xl shadow-xl p-8">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">
            🔧 Admin QR Station
          </h2>
          
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center gap-4 bg-slate-700 rounded-xl p-4">
              <label className="text-lg font-semibold text-white">Question Number:</label>
              <input 
                type="number" 
                className="border-2 border-slate-600 bg-slate-600 text-white px-4 py-2 w-24 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold" 
                value={questionNumber}
                onChange={(e) => setQuestionNumber(Number(e.target.value) || 1)} 
                min={1} 
              />
            </div>
            
            {error && (
              <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-4 w-full">
                <p className="text-red-300 text-center font-medium">{error}</p>
              </div>
            )}
            
            <div className="bg-slate-700 border-2 border-slate-600 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 text-center">QR Code for Question {questionNumber}</h3>
              <div className="flex justify-center">
                {token ? (
                  <QRCode value={token} size={280} />
                ) : (
                  <div className="w-[280px] h-[280px] grid place-items-center bg-slate-600 rounded-lg">
                    <span className="text-slate-400 text-lg">No token available</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-slate-300 text-lg">
                Token refreshes automatically every <span className="font-bold text-blue-400">{ttl}</span> seconds
              </p>
              <p className="text-sm text-slate-400">
                Display this QR code at the physical location for Question {questionNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


