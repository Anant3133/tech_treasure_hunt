import { useEffect, useState } from 'react';
import api from '../api/http';
import NavLayout from '../components/NavLayout.jsx';

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
    <NavLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">
            🏆 Leaderboard
          </h2>
          
          {error && (
            <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-4 mb-6">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="p-4 text-left font-bold text-lg">Rank</th>
                  <th className="p-4 text-left font-bold text-lg">Team</th>
                  <th className="p-4 text-left font-bold text-lg">Current Question</th>
                  <th className="p-4 text-left font-bold text-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-slate-600 hover:bg-slate-700 transition-colors ${idx < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center">
                        {idx === 0 && <span className="text-2xl mr-2">🥇</span>}
                        {idx === 1 && <span className="text-2xl mr-2">🥈</span>}
                        {idx === 2 && <span className="text-2xl mr-2">🥉</span>}
                        <span className={`font-bold text-lg ${idx < 3 ? 'text-yellow-400' : 'text-slate-300'}`}>
                          {idx + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-lg text-white">{r.teamName}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-lg text-slate-300">{r.currentQuestion || 0}</span>
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
              <p className="text-slate-400 text-lg">No teams registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </NavLayout>
  );
}


