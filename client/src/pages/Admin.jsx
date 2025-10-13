import { useEffect, useState } from 'react';
import { getCurrentQrToken } from '../api/admin';
import QRCode from 'react-qr-code';

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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Admin QR Station</h2>
      <div className="flex items-center gap-2">
        <label>Question:</label>
        <input type="number" className="border px-2 py-1 w-24" value={questionNumber}
               onChange={(e) => setQuestionNumber(Number(e.target.value) || 1)} min={1} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="bg-white p-4 rounded shadow inline-block">
        {token ? <QRCode value={token} size={220} /> : <div className="w-[220px] h-[220px] grid place-items-center">No token</div>}
      </div>
      <p className="text-sm text-gray-600">Token refreshes automatically. TTL ~ {ttl}s.</p>
    </div>
  );
}


