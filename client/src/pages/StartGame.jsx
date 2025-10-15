import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function StartGame() {
  const navigate = useNavigate();

  function handleStartGame() {
    navigate('/game');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Ready to Hunt? 🎯
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Solve puzzles, scan QR codes at each location, and race to be the first team to complete all questions!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              onClick={handleStartGame}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
            >
              🚀 Start Game
            </button>
            
            <button 
              onClick={handleLogout}
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Game Info Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          How It Works 🎮
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🧩</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Solve Puzzles</h3>
              <p className="text-gray-600 leading-relaxed">
                Answer riddles and brain teasers to unlock the next clue. Each question gets you closer to victory!
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Scan QR Codes</h3>
              <p className="text-gray-600 leading-relaxed">
                Use your camera to scan QR codes at each checkpoint. These codes verify your progress and unlock hints.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Race to Victory</h3>
              <p className="text-gray-600 leading-relaxed">
                Compete with other teams! The fastest team to complete all questions wins the treasure hunt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pro Tips 💡
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">⚡</span>
                <p className="text-lg">Work as a team - two heads are better than one!</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">🔍</span>
                <p className="text-lg">Read questions carefully and think outside the box</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">📱</span>
                <p className="text-lg">Keep your phone charged for QR scanning</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">⏰</span>
                <p className="text-lg">Time is crucial - don't spend too long on one question</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">🎯</span>
                <p className="text-lg">Use hints wisely - they can save precious time</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">🏃</span>
                <p className="text-lg">Move quickly between locations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            Good luck, hunters! May the fastest team win! 🏆
          </p>
        </div>
      </div>
    </div>
  );
}
