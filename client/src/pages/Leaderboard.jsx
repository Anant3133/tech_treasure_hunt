import { useEffect, useState } from 'react';
import api from '../api/http';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/leaderboard');
        setRows(data || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load leaderboard');
      }
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Rank</th>
              <th className="p-2 border">Team</th>
              <th className="p-2 border">Current Question</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id}>
                <td className="p-2 border">{idx + 1}</td>
                <td className="p-2 border">{r.teamName}</td>
                <td className="p-2 border">{r.currentQuestion || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


