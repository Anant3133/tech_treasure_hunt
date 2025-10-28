import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';
import { FaTrophy, FaMedal, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../App.jsx';
import { decodeJWT } from '../api/utils';

export default function Completion() {
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchRank() {
      try {
        const res = await api.get('/leaderboard');
        
        // Get team name from auth context or decode from JWT
        let teamName = user?.teamName;
        if (!teamName) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            const decoded = decodeJWT(token);
            teamName = decoded?.teamName;
          }
        }
        
        console.log('Completion: Looking for team:', teamName);
        console.log('Completion: Leaderboard data:', res.data);
        
        if (res.data && Array.isArray(res.data) && teamName) {
          const idx = res.data.findIndex(t => t.teamName === teamName);
          console.log('Completion: Found at index:', idx);
          if (idx !== -1) setRank(idx + 1);
        }
      } catch (e) {
        console.error('Completion: Error fetching rank:', e);
        setRank(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRank();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <div className="bg-white/10 border-2 border-green-400 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-4xl font-bold text-green-200 mb-4">🎉 Congratulations! 🎉</h1>
        <p className="text-xl text-green-100 mb-6">You have completed the Tech Treasure Hunt!</p>
        {loading ? (
          <p className="text-green-100 flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin" /> Fetching your rank...
          </p>
        ) : rank ? (
          <p className="text-2xl font-semibold text-green-300 mb-4 flex items-center justify-center gap-2">
            <FaMedal className="text-3xl" /> Your Rank: <span className="text-green-100">#{rank}</span>
          </p>
        ) : (
          <p className="text-green-100">Could not determine your rank.</p>
        )}
        <button
          className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 mx-auto"
          onClick={() => navigate('/leaderboard')}
        >
          <FaTrophy /> View Leaderboard
        </button>
      </div>
    </div>
  );
}
