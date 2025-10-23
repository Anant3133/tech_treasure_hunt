import { useEffect, useState } from 'react';
import api from '../api/http';
import NavLayout from '../components/NavLayout.jsx';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [modalTeam, setModalTeam] = useState(null);

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
      <div className="min-h-screen bg-slate-900 text-white px-3 py-4 sm:px-6 md:px-10">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6">
            🏆 Leaderboard
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded-xl p-3 mb-4">
              <p className="text-red-300 text-center text-sm sm:text-base">{error}</p>
            </div>
          )}

          {/* Mobile-first layout */}
          <div className="flex flex-col sm:hidden gap-2">
            {rows.map((r, idx) => (
              <button
                key={r.id}
                className={`w-full text-left rounded-xl border border-slate-700 bg-slate-700 p-3 flex flex-col gap-2 shadow-md active:scale-[0.98] transition-transform ${
                  idx < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20' : ''
                }`}
                onClick={() => setModalTeam(r)}
              >
                <div className="flex items-center gap-2">
                  {idx === 0 && <span className="text-lg">🥇</span>}
                  {idx === 1 && <span className="text-lg">🥈</span>}
                  {idx === 2 && <span className="text-lg">🥉</span>}
                  <span
                    className={`font-bold ${
                      idx < 3 ? 'text-yellow-400' : 'text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="ml-2 font-semibold text-sm text-white truncate flex-1">
                    {r.teamName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">
                    Q: {r.currentQuestion || 0}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      r.finishTime
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {r.finishTime ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:block overflow-x-auto rounded-xl">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="p-3 sm:p-4 text-left font-semibold">Rank</th>
                  <th className="p-3 sm:p-4 text-left font-semibold">Team</th>
                  <th className="p-3 sm:p-4 text-left font-semibold">
                    Current Question
                  </th>
                  <th className="p-3 sm:p-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer ${
                      idx < 3
                        ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20'
                        : ''
                    }`}
                    onClick={() => setModalTeam(r)}
                  >
                    <td className="p-3 sm:p-4 font-bold">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span>🥇</span>}
                        {idx === 1 && <span>🥈</span>}
                        {idx === 2 && <span>🥉</span>}
                        <span
                          className={`${
                            idx < 3 ? 'text-yellow-400' : 'text-slate-300'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 font-semibold text-white">
                      {r.teamName}
                    </td>
                    <td className="p-3 sm:p-4 text-slate-300">
                      {r.currentQuestion || 0}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          r.finishTime
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {r.finishTime ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {modalTeam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3">
              <div className="bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md border border-slate-600 relative">
                <button
                  className="absolute top-2 right-3 text-slate-400 hover:text-white text-2xl font-bold"
                  onClick={() => setModalTeam(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-4">
                  {modalTeam.teamName} Members
                </h3>
                {modalTeam.members && modalTeam.members.length > 0 ? (
                  <ul className="space-y-2 sm:space-y-3">
                    {modalTeam.members.map((m, i) => (
                      <li
                        key={i}
                        className="bg-slate-700 rounded-lg p-3 flex flex-col"
                      >
                        <span className="text-white font-semibold text-sm sm:text-base">
                          {m.name}
                        </span>
                        <span className="text-slate-300 text-xs sm:text-sm">
                          {m.contact}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-center text-sm">
                    No member info available.
                  </p>
                )}
              </div>
            </div>
          )}

          {rows.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">
                No teams registered yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </NavLayout>
  );
}
