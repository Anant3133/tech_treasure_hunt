import { useState } from 'react';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(teamName, password);
      } else {
        await register({ teamName, password });
      }
      navigate('/game');
    } catch (e) {
      setError(e?.response?.data?.message || 'Auth failed');
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" className="border px-3 py-2 w-full" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="border px-3 py-2 w-full" />
        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded">{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-3 text-sm text-blue-700 underline">
        {mode === 'login' ? 'Create new team' : 'Have an account? Login'}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}


