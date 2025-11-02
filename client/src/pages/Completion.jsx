import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaHome } from 'react-icons/fa';

export default function Completion() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <div className="bg-white/10 border-2 border-green-400 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
        <div className="mb-6">
          <FaTrophy className="text-8xl text-yellow-400 mx-auto mb-4 animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold text-green-200 mb-4">🎉 Hunt Completed! 🎉</h1>
        <p className="text-xl text-green-100 mb-8">
          Congratulations! You have successfully completed the Tech Treasure Hunt!
        </p>
        <button
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg flex items-center gap-3 mx-auto transition-all hover:scale-105"
          onClick={() => navigate('/')}
        >
          <FaHome className="text-xl" /> Return to Home
        </button>
      </div>
    </div>
  );
}
