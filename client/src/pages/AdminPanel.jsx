import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { login, register } from '../api/auth';
import { useAuth } from '../App.jsx';
import { getCurrentQrToken } from '../api/admin';
import api from '../api/http';
import QRCode from 'react-qr-code';
import { FaQrcode, FaQuestionCircle, FaUsers, FaUserPlus, FaTrophy, FaEdit, FaTrash, FaClock, FaCheckCircle, FaSpinner, FaSignOutAlt, FaMedal } from 'react-icons/fa';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);
  
  // Auth form state
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [adminInviteKey, setAdminInviteKey] = useState('');
  const [authError, setAuthError] = useState(null);
  const { login: authLogin } = useAuth();
  
  // Admin panel state
  const [activeTab, setActiveTab] = useState('qr');
  const [questions, setQuestions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionError, setQuestionError] = useState(null);
  const [qrQuestionNumber, setQrQuestionNumber] = useState(1);
  const [qrToken, setQrToken] = useState('');
  const [qrTtl, setQrTtl] = useState(60);
  const [qrCountdown, setQrCountdown] = useState(60);
  const countdownIntervalRef = useRef();
  const qrExpiryRef = useRef(Date.now() + 60000);
  const lastTokenRef = useRef('');
  
  // Question form state
  const [questionForm, setQuestionForm] = useState({
    questionNumber: '',
    text: '',
    answer: '',
    hint: ''
  });

  // Register team form state
  const [registerForm, setRegisterForm] = useState({
    teamName: '',
    password: '',
    members: [
      { name: '', contact: '' },
      { name: '', contact: '' },
      { name: '', contact: '' },
      { name: '', contact: '' },
    ]
  });
  const [registerError, setRegisterError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify if it's an admin token
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Try to access admin endpoint to verify admin role
      await api.get('/admin/questions');
      setIsAuthenticated(true);
      loadAdminData();
    } catch (error) {
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [questionsRes, teamsRes, leaderboardRes] = await Promise.all([
        api.get('/admin/questions'),
        api.get('/admin/teams'),
        api.get('/leaderboard')
      ]);
  // Remove duplicate questionNumbers, keep only the first occurrence
  const seen = new Set();
  const deduped = [...questionsRes.data]
    .sort((a, b) => Number(a.questionNumber) - Number(b.questionNumber))
    .filter(q => {
      if (seen.has(Number(q.questionNumber))) return false;
      seen.add(Number(q.questionNumber));
      return true;
    });
  setQuestions(deduped);
      setTeams(teamsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      let resp;
      if (authMode === 'login') {
        resp = await login(teamName, password);
      } else {
        resp = await register({ 
          teamName, 
          password, 
          role: 'admin', 
          adminInviteKey 
        });
      }
      // If we received a token, persist it in auth context/localStorage
      if (resp?.token) {
        authLogin(resp.token);
        toast.success(authMode === 'login' ? 'Admin login successful!' : 'Admin registration successful!');
      }
      // Check if the login was successful and user is admin
      await checkAuthStatus();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Authentication failed';
      setAuthError(msg);
      toast.error(msg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setTeamName('');
    setPassword('');
    setAdminInviteKey('');
  };

  // QR Code functionality
  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    let intervalId;

    const fetchToken = async () => {
      try {
        const data = await getCurrentQrToken(qrQuestionNumber);
        if (!mounted) return;
        // Only update expiry/timer if token actually changed
        if (data.token !== lastTokenRef.current) {
          setQrToken(data.token);
          setQrTtl(data.ttlSeconds || 60);
          const expiry = Date.now() + ((data.ttlSeconds || 60) * 1000);
          qrExpiryRef.current = expiry;
          setQrCountdown(Math.ceil((expiry - Date.now()) / 1000));
          lastTokenRef.current = data.token;
        }
      } catch (error) {
        console.error('Failed to fetch QR token:', error);
      }
    };

    fetchToken();
    intervalId = setInterval(fetchToken, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [qrQuestionNumber, isAuthenticated]);

  // Countdown timer for QR expiry (accurate, resets only on new token)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((qrExpiryRef.current - Date.now()) / 1000));
      setQrCountdown(secondsLeft);
    }, 250);
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated]);

  // Question management
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setQuestionError(null);
    try {
      await api.post('/admin/questions', questionForm);
      setQuestionForm({ questionNumber: '', text: '', answer: '', hint: '' });
      loadAdminData();
    } catch (error) {
      setQuestionError(error?.response?.data?.message || 'Failed to create/update question');
      console.error('Failed to create question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId, questionNumber) => {
    if (!confirm(`Delete question ${questionNumber}?`)) return;
    setQuestionError(null);
    try {
      await api.delete(`/admin/questions/id/${questionId}`);
      // Decrement questionNumber for all questions with higher number
      setQuestions(qs => {
        const filtered = qs.filter(q => q.id !== questionId);
        const updated = filtered.map(q => {
          if (Number(q.questionNumber) > Number(questionNumber)) {
            const newQ = { ...q, questionNumber: Number(q.questionNumber) - 1 };
            // Update backend for each affected question
            api.post('/admin/questions', newQ).catch(err => setQuestionError(err?.response?.data?.message || 'Failed to update question numbers'));
            return newQ;
          }
          return q;
        });
        return updated;
      });
      loadAdminData();
    } catch (error) {
      setQuestionError(error?.response?.data?.message || 'Failed to delete question');
      console.error('Failed to delete question:', error);
    }
  };

  // Drag and drop for rearranging questions
  const [dragIndex, setDragIndex] = useState(null);
  const handleDragStart = (idx) => setDragIndex(idx);
  const handleDragEnter = (idx) => {
    if (dragIndex === null || dragIndex === idx) return;
    setQuestionError(null);
    setQuestions(qs => {
      const arr = [...qs];
      const [removed] = arr.splice(dragIndex, 1);
      arr.splice(idx, 0, removed);
      // Renumber all questions in new order
      arr.forEach((q, i) => {
        if (Number(q.questionNumber) !== i + 1) {
          const newQ = { ...q, questionNumber: i + 1 };
          arr[i] = newQ;
          // Update backend for each affected question
          api.post('/admin/questions', newQ).catch(err => setQuestionError(err?.response?.data?.message || 'Failed to update question numbers'));
        }
      });
      return arr;
    });
    setDragIndex(idx);
  };
  const handleDragEnd = () => setDragIndex(null);

  const handleResetTeam = async (teamId) => {
    if (!confirm('Reset this team\'s progress?')) return;
    
    try {
      await api.post(`/admin/teams/${teamId}/reset`, { currentQuestion: 1 });
      loadAdminData();
    } catch (error) {
      console.error('Failed to reset team:', error);
    }
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    
    if (registerForm.password.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    const validMembers = registerForm.members.filter(m => m.name.trim() && m.contact.trim());
    if (validMembers.length < 2) {
      setRegisterError('Please enter at least 2 team members with name and contact.');
      toast.error('Please enter at least 2 team members with name and contact.');
      return;
    }
    
    try {
      await register({ 
        teamName: registerForm.teamName, 
        password: registerForm.password, 
        members: validMembers 
      });
      toast.success('Team registered successfully!');
      setRegisterForm({
        teamName: '',
        password: '',
        members: [
          { name: '', contact: '' },
          { name: '', contact: '' },
          { name: '', contact: '' },
          { name: '', contact: '' },
        ]
      });
      loadAdminData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to register team';
      setRegisterError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            🔧 Admin Panel
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Admin team name"
              className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            {authMode === 'register' && (
              <input
                type="text"
                value={adminInviteKey}
                onChange={(e) => setAdminInviteKey(e.target.value)}
                placeholder="Admin invite key"
                className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {authMode === 'login' ? 'Login' : 'Register'} as Admin
            </button>
          </form>
          
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="mt-4 w-full text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            {authMode === 'login' ? 'Need to register as admin?' : 'Already have admin account?'}
          </button>
          
          {authError && (
            <p className="mt-4 text-sm text-red-400 text-center bg-red-900/20 p-3 rounded-lg border border-red-800">
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🔧 Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'qr', label: 'QR Codes', icon: <FaQrcode /> },
              { id: 'questions', label: 'Questions', icon: <FaQuestionCircle /> },
              { id: 'teams', label: 'Teams', icon: <FaUsers /> },
              { id: 'register', label: 'Register Team', icon: <FaUserPlus /> },
              { id: 'leaderboard', label: 'Leaderboard', icon: <FaTrophy /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">QR Code Generator</h2>
              
              <div className="flex items-center gap-4 mb-6">
                <label className="text-lg font-semibold text-slate-300">Question Number:</label>
                <input
                  type="number"
                  value={qrQuestionNumber}
                  onChange={(e) => setQrQuestionNumber(Number(e.target.value) || 1)}
                  min={1}
                  max={questions.length || 10}
                  className="bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-400">
                  (Max: {questions.length || 10} questions)
                </span>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-4">
                  QR Code for Question {qrQuestionNumber}
                </h3>
                <div className="flex justify-center mb-4">
                  {qrToken ? (
                    <div className="bg-white p-4 rounded-lg">
                      <QRCode value={qrToken} size={256} />
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-slate-600 rounded-lg flex items-center justify-center">
                      <span className="text-slate-400">Loading...</span>
                    </div>
                  )}
                </div>
                <p className="text-slate-300 flex items-center justify-center gap-2">
                  <FaClock className="text-blue-400" />
                  QR expires in: <span className="font-bold text-blue-400">{qrCountdown}</span> seconds
                  {" "}
                  <span className="text-slate-400 text-xs">(auto-refreshes every {qrTtl} seconds)</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Create Question Form */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Create/Update Question</h2>
              
              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={questionForm.questionNumber}
                    onChange={(e) => setQuestionForm({...questionForm, questionNumber: e.target.value})}
                    placeholder="Question Number"
                    className="bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={questionForm.answer}
                    onChange={(e) => setQuestionForm({...questionForm, answer: e.target.value})}
                    placeholder="Answer"
                    className="bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <textarea
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})}
                  placeholder="Question Text"
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                <input
                  type="text"
                  value={questionForm.hint}
                  onChange={(e) => setQuestionForm({...questionForm, hint: e.target.value})}
                  placeholder="Hint (optional)"
                  className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Create/Update Question
                </button>
              </form>
            </div>

            {/* Questions List */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Existing Questions</h2>
              {questionError && (
                <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-3 mb-4">
                  <p className="text-red-300 text-center text-sm">{questionError}</p>
                </div>
              )}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${dragIndex === idx ? 'ring-2 ring-blue-400' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    style={{ cursor: 'grab' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">
                          Question {q.questionNumber}
                        </h3>
                        <p className="text-slate-300 mb-2">{q.text}</p>
                        <p className="text-green-400">Answer: {q.answer}</p>
                        {q.hint && <p className="text-yellow-400">Hint: {q.hint}</p>}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button
                          onClick={() => handleDeleteQuestion(q.id, q.questionNumber)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <FaTrash /> Delete
                        </button>
                        <span className="text-xs text-slate-400 select-none">Drag to reorder</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Team Management</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300">Team Name</th>
                    <th className="text-left py-3 px-4 text-slate-300">Current Question</th>
                    <th className="text-left py-3 px-4 text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id} className="border-b border-slate-700">
                      <td className="py-3 px-4 text-white font-medium">{team.teamName}</td>
                      <td className="py-3 px-4 text-slate-300">{team.currentQuestion || 1}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.finishTime 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-blue-900/30 text-blue-400'
                        }`}>
                          {team.finishTime ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleResetTeam(team.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Reset Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Register New Team</h2>
            
            <form onSubmit={handleRegisterTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={registerForm.teamName}
                  onChange={(e) => setRegisterForm({...registerForm, teamName: e.target.value})}
                  placeholder="Team Name"
                  className="bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  placeholder="Password (min 6 characters)"
                  className="bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-slate-300 text-sm font-semibold">
                  Team Members (min 2, max 4):
                </label>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={registerForm.members[i].name}
                      onChange={e => setRegisterForm({
                        ...registerForm,
                        members: registerForm.members.map((m, idx) => 
                          idx === i ? { ...m, name: e.target.value } : m
                        )
                      })}
                      placeholder={`Member ${i + 1} Name${i < 2 ? ' *' : ''}`}
                      className="bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={i < 2}
                    />
                    <input
                      type="text"
                      value={registerForm.members[i].contact}
                      onChange={e => setRegisterForm({
                        ...registerForm,
                        members: registerForm.members.map((m, idx) => 
                          idx === i ? { ...m, contact: e.target.value } : m
                        )
                      })}
                      placeholder={`Contact${i < 2 ? ' *' : ''}`}
                      className="bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={i < 2}
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-400">
                  * Required. Enter at least 2 members with name and contact.
                </p>
              </div>
              
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Register Team
              </button>
              
              {registerError && (
                <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-3">
                  <p className="text-red-300 text-center text-sm">{registerError}</p>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">🏆 Leaderboard</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300 font-bold">Rank</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-bold">Team Name</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-bold">Progress</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-bold">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-bold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, idx) => (
                    <tr 
                      key={team.id} 
                      className={`border-b border-slate-700 ${
                        idx === 0 ? 'bg-yellow-900/20' : 
                        idx === 1 ? 'bg-slate-700/30' : 
                        idx === 2 ? 'bg-orange-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-white font-bold">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{team.teamName}</td>
                      <td className="py-3 px-4 text-slate-300">
                        Question {team.currentQuestion || 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.finishTime 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-blue-900/30 text-blue-400'
                        }`}>
                          {team.finishTime ? '✅ Completed' : '⏳ In Progress'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-sm">
                        {team.finishTime 
                          ? new Date(team.finishTime.seconds ? team.finishTime.seconds * 1000 : team.finishTime).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No teams registered yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}