import { useState } from 'react';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { decodeJWT } from '../api/utils';

export default function Login() {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminInviteKey, setAdminInviteKey] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      let response;
      const normalizedTeamName = String(teamName || '').trim();
      if (mode === 'login') {
        response = await login(normalizedTeamName, password);
      } else {
        const registerData = { teamName: normalizedTeamName, password };
        if (isAdminMode) {
          registerData.role = 'admin';
          registerData.adminInviteKey = adminInviteKey;
        }
        console.log('Registration data being sent:', registerData);
        response = await register(registerData);
      }
      
      if (response?.token) {
        authLogin(response.token); // Use context login
        
        // Decode token to check user role and redirect appropriately
        const decoded = decodeJWT(response.token);
        if (decoded?.role === 'admin') {
          navigate('/admin-panel');
        } else {
          navigate('/game');
        }
      } else {
        setError('No token received');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Auth failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-6 text-white text-center">{mode === 'login' ? 'Login' : 'Register'}</h2>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input 
            value={teamName} 
            onChange={(e) => setTeamName(e.target.value)} 
            placeholder="Team name" 
            className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          
          {mode === 'register' && (
            <div className="space-y-3">
              <label className="flex items-center space-x-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isAdminMode}
                  onChange={(e) => setIsAdminMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span>Register as Admin</span>
              </label>
              
              {isAdminMode && (
                <input
                  type="text"
                  value={adminInviteKey}
                  onChange={(e) => setAdminInviteKey(e.target.value)}
                  placeholder="Admin Invite Key"
                  className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}
          
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
            {mode === 'login' ? 'Login' : `Register${isAdminMode ? ' as Admin' : ''}`}
          </button>
        </form>
        <button 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
          className="mt-4 w-full text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          {mode === 'login' ? 'Create new team' : 'Have an account? Login'}
        </button>
        {error && <p className="mt-4 text-sm text-red-400 text-center bg-red-900/20 p-3 rounded-lg border border-red-800">{error}</p>}
      </div>
    </div>
  );
}


