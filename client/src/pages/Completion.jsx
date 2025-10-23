import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';

export default function Completion() {
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRank() {
      try {
        const res = await api.get('/leaderboard');
        const teamName = localStorage.getItem('team_name');
        if (res.data && Array.isArray(res.data)) {
          const idx = res.data.findIndex(t => t.teamName === teamName);
          if (idx !== -1) setRank(idx + 1);
        }
      } catch (e) {
        setRank(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRank();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <div className="bg-white/10 border-2 border-green-400 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-4xl font-bold text-green-200 mb-4">🎉 Congratulations! 🎉</h1>
        <p className="text-xl text-green-100 mb-6">You have completed the Tech Treasure Hunt!</p>
        {loading ? (
          <p className="text-green-100">Fetching your rank...</p>
        ) : rank ? (
          <p className="text-2xl font-semibold text-green-300 mb-4">Your Rank: <span className="text-green-100">#{rank}</span></p>
        ) : (
          <p className="text-green-100">Could not determine your rank.</p>
        )}
        <button
          className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg"
          onClick={() => navigate('/leaderboard')}
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
}
