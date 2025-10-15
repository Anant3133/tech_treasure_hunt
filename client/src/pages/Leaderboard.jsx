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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            🏆 Leaderboard
          </h2>
          
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <th className="p-4 text-left font-bold text-lg">Rank</th>
                  <th className="p-4 text-left font-bold text-lg">Team</th>
                  <th className="p-4 text-left font-bold text-lg">Current Question</th>
                  <th className="p-4 text-left font-bold text-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className={`border-b hover:bg-gray-50 transition-colors ${idx < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center">
                        {idx === 0 && <span className="text-2xl mr-2">🥇</span>}
                        {idx === 1 && <span className="text-2xl mr-2">🥈</span>}
                        {idx === 2 && <span className="text-2xl mr-2">🥉</span>}
                        <span className={`font-bold text-lg ${idx < 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {idx + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-lg text-gray-800">{r.teamName}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-lg text-gray-600">{r.currentQuestion || 0}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        r.finishTime ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.finishTime ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {rows.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No teams registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


