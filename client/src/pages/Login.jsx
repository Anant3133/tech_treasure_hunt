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
  const [members, setMembers] = useState([
    { name: '', contact: '' },
    { name: '', contact: '' },
    { name: '', contact: '' },
    { name: '', contact: '' },
  ]);
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
        let registerData = { teamName: normalizedTeamName, password };
        if (isAdminMode) {
          registerData.role = 'admin';
          registerData.adminInviteKey = adminInviteKey;
        } else {
          // Only include members with both name and contact filled
          const filteredMembers = members
            .map(m => ({ name: m.name.trim(), contact: m.contact.trim() }))
            .filter(m => m.name && m.contact);
          if (filteredMembers.length < 2) {
            setError('At least 2 team members (name and contact) are required');
            return;
          }
          registerData.members = filteredMembers;
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
              <label className="flex items-center space-x-3 text-sm text-slate-300 mt-2">
                <input
                  type="checkbox"
                  checked={isAdminMode}
                  onChange={(e) => setIsAdminMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span>Register as Admin</span>
              </label>
              {!isAdminMode && (
                <div className="space-y-2">
                  <label className="block text-slate-300 text-sm font-semibold mb-1">Team Members (min 2, max 4):</label>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex gap-2 mb-1">
                      <input
                        type="text"
                        value={members[i].name}
                        onChange={e => setMembers(m => m.map((mem, idx) => idx === i ? { ...mem, name: e.target.value } : mem))}
                        placeholder={`Member ${i+1} Name${i<2?' *':''}`}
                        className="flex-1 bg-slate-700 border border-slate-600 px-3 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={i<2}
                      />
                      <input
                        type="text"
                        value={members[i].contact}
                        onChange={e => setMembers(m => m.map((mem, idx) => idx === i ? { ...mem, contact: e.target.value } : mem))}
                        placeholder={`Contact${i<2?' *':''}`}
                        className="flex-1 bg-slate-700 border border-slate-600 px-3 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={i<2}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-400">* Required. Enter at least 2 members with name and contact.</p>
                </div>
              )}
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


