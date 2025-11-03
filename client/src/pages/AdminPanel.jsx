import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { login, register } from '../api/auth';
import { useAuth } from '../App.jsx';
import { getCurrentQrToken, bulkRegisterTeams } from '../api/admin';
import { pauseTeam, unpauseTeam } from '../api/checkpoint';
import api from '../api/http';
import QRCode from 'react-qr-code';
import { FaQrcode, FaQuestionCircle, FaUsers, FaUserPlus, FaTrophy, FaEdit, FaTrash, FaClock, FaCheckCircle, FaSpinner, FaSignOutAlt, FaMedal, FaFileUpload, FaDownload, FaPause, FaPlay } from 'react-icons/fa';

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
    hint: '',
    imageUrl: '',
    links: [] // Array of {text, url}
  });
  
  // Raw text for links textarea (for controlled input)
  const [linksRawText, setLinksRawText] = useState('');

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

  // CSV bulk upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResults, setCsvResults] = useState(null);
  const fileInputRef = useRef(null);

  // Team details modal state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

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
      setQuestionForm({ questionNumber: '', text: '', answer: '', hint: '', imageUrl: '', links: [] });
      setLinksRawText(''); // Clear the raw text field
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
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  
  const handleDragStart = (idx) => {
    setDragIndex(idx);
  };
  
  const handleDragEnter = (idx) => {
    if (dragIndex === null || dragIndex === idx) return;
    setDraggedOverIndex(idx);
  };
  
  const handleDragEnd = async () => {
    if (dragIndex === null || draggedOverIndex === null || dragIndex === draggedOverIndex) {
      setDragIndex(null);
      setDraggedOverIndex(null);
      return;
    }

    setQuestionError(null);
    
    // Reorder questions in state
    const arr = [...questions];
    const [removed] = arr.splice(dragIndex, 1);
    arr.splice(draggedOverIndex, 0, removed);
    
    // Renumber all questions in new order
    const updatedQuestions = arr.map((q, i) => ({
      ...q,
      questionNumber: i + 1
    }));
    
    // Update state immediately for UI feedback
    setQuestions(updatedQuestions);
    
    // Update database for all affected questions
    try {
      const updatePromises = updatedQuestions.map(q => 
        api.post('/admin/questions', q)
      );
      await Promise.all(updatePromises);
      toast.success('Questions reordered successfully');
    } catch (err) {
      setQuestionError(err?.response?.data?.message || 'Failed to update question order');
      toast.error('Failed to reorder questions');
      // Reload questions on error to restore correct order
      fetchQuestions();
    }
    
    setDragIndex(null);
    setDraggedOverIndex(null);
  };

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

  // CSV bulk upload handlers
  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvResults(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setCsvUploading(true);
    setCsvResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvContent = event.target.result;
          const results = await bulkRegisterTeams(csvContent);
          setCsvResults(results);
          
          if (results.success.length > 0) {
            toast.success(`Successfully registered ${results.success.length} team(s)!`);
            loadAdminData();
          }
          
          if (results.failed.length > 0) {
            toast.error(`Failed to register ${results.failed.length} team(s)`);
          }
          
          if (results.duplicates.length > 0) {
            toast.warning(`${results.duplicates.length} team(s) already exist`);
          }
        } catch (error) {
          console.error('CSV upload error:', error);
          toast.error(error?.response?.data?.message || 'Failed to process CSV');
        } finally {
          setCsvUploading(false);
        }
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read CSV file');
      setCsvUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const template = 'Team Name,Member 1 Name,Member 1 Contact,Member 2 Name,Member 2 Contact,Member 3 Name,Member 3 Contact,Member 4 Name,Member 4 Contact\n' +
                     'Team Alpha,John Doe,1234567890,Jane Smith,0987654321,Bob Johnson,1111111111,Alice Williams,2222222222\n' +
                     'Team Beta,Mike Brown,3333333333,Sarah Davis,4444444444,,,,';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_registration_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadCredentials = () => {
    if (!csvResults || csvResults.success.length === 0) {
      toast.error('No successful registrations to download');
      return;
    }

    let csvContent = 'Team Name,Password,Member Count\n';
    csvResults.success.forEach(team => {
      csvContent += `${team.teamName},${team.password},${team.memberCount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Credentials downloaded!');
  };

  // Team details modal handlers
  const handleTeamClick = async (team) => {
    try {
      // Try to find in teams state first (has members from backend)
      let fullTeam = teams.find(t => t.id === team.id);
      
      // If not found in teams or missing members data, try leaderboard data
      if (!fullTeam || !fullTeam.members) {
        fullTeam = team;
      }
      
      // If still no members, fetch fresh data
      if (!fullTeam.members || fullTeam.members.length === 0) {
        const response = await api.get('/admin/teams');
        const freshTeam = response.data.find(t => t.id === team.id);
        if (freshTeam) {
          fullTeam = { ...fullTeam, members: freshTeam.members || [] };
        }
      }
      
      console.log('Team details:', fullTeam);
      setSelectedTeam(fullTeam);
      setShowTeamModal(true);
    } catch (error) {
      console.error('Failed to load team details:', error);
      toast.error('Failed to load team details');
    }
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
  };

  // Pause/Unpause handlers
  const handlePauseTeam = async (teamId) => {
    try {
      await pauseTeam(teamId);
      toast.success('Team paused successfully');
      fetchTeams(); // Refresh team data
      // Update selected team if modal is open
      if (selectedTeam && selectedTeam.id === teamId) {
        const updated = teams.find(t => t.id === teamId);
        if (updated) {
          setSelectedTeam({ ...updated, isPaused: true });
        }
      }
    } catch (error) {
      console.error('Failed to pause team:', error);
      toast.error('Failed to pause team');
    }
  };

  const handleUnpauseTeam = async (teamId) => {
    try {
      await unpauseTeam(teamId);
      toast.success('Team unpaused successfully');
      fetchTeams(); // Refresh team data
      // Update selected team if modal is open
      if (selectedTeam && selectedTeam.id === teamId) {
        const updated = teams.find(t => t.id === teamId);
        if (updated) {
          setSelectedTeam({ ...updated, isPaused: false });
        }
      }
    } catch (error) {
      console.error('Failed to unpause team:', error);
      toast.error('Failed to unpause team');
    }
  };

  // Helper function to format Firestore timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    
    try {
      let date;
      
      // Handle Firestore Timestamp object
      if (timestamp._seconds || timestamp.seconds) {
        const seconds = timestamp._seconds || timestamp.seconds;
        date = new Date(seconds * 1000);
      } 
      // Handle nanoseconds format
      else if (timestamp._nanoseconds || timestamp.nanoseconds) {
        const seconds = timestamp._seconds || timestamp.seconds || 0;
        date = new Date(seconds * 1000);
      }
      // Handle ISO string
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Handle regular Date or timestamp in milliseconds
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Handle Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Fallback
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return 'Invalid Date';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return 'Invalid Date';
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
              { id: 'bulk-upload', label: 'Bulk Upload', icon: <FaFileUpload /> },
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

            {/* Checkpoint QR Codes */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                Checkpoint QR Codes
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Static QR codes for checkpoints. Teams scan these at the starting point after Q4, Q8, and Q12.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((checkpointNum) => (
                  <div key={checkpointNum} className="bg-slate-700 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Checkpoint {checkpointNum}
                    </h3>
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-4 rounded-lg">
                        <QRCode value={`checkpoint-${checkpointNum}`} size={180} />
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">
                      After Q{checkpointNum === 1 ? 4 : checkpointNum === 2 ? 8 : 12}
                    </p>
                  </div>
                ))}
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
                
                <input
                  type="text"
                  value={questionForm.imageUrl}
                  onChange={(e) => setQuestionForm({...questionForm, imageUrl: e.target.value})}
                  placeholder="Image URL (optional) - e.g., https://example.com/image.jpg"
                  className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Links Section */}
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Hyperlinks (optional)</h3>
                  <p className="text-slate-400 text-sm mb-3">Add clickable links for reference. Format: text|url (one per line)</p>
                  <textarea
                    value={linksRawText}
                    onChange={(e) => {
                      const textValue = e.target.value;
                      setLinksRawText(textValue);
                      
                      // Parse links from complete lines
                      const lines = textValue.split('\n');
                      const links = lines
                        .map(line => {
                          const trimmedLine = line.trim();
                          if (!trimmedLine) return null;
                          
                          // If line contains a pipe, use text|url format
                          if (trimmedLine.includes('|')) {
                            const [text, url] = trimmedLine.split('|').map(s => s.trim());
                            return text && url ? { text, url } : null;
                          }
                          
                          // If line is just a URL, use URL as both text and url
                          try {
                            const url = new URL(trimmedLine);
                            // Use hostname as text if no text provided
                            return { text: url.hostname, url: url.href };
                          } catch {
                            return null;
                          }
                        })
                        .filter(Boolean);
                      setQuestionForm({...questionForm, links});
                    }}
                    placeholder="Example:&#10;Wikipedia Article|https://en.wikipedia.org/wiki/Python&#10;Documentation|https://docs.python.org"
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  {questionForm.links && questionForm.links.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-slate-400 text-xs">Preview:</p>
                      {questionForm.links.map((link, idx) => (
                        <div key={idx} className="text-sm text-blue-400 flex items-center gap-2">
                          🔗 {link.text} → {link.url}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
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
                    className={`bg-slate-700 rounded-lg p-4 border border-slate-600 transition-all ${
                      dragIndex === idx 
                        ? 'ring-2 ring-blue-400 opacity-50' 
                        : draggedOverIndex === idx 
                        ? 'ring-2 ring-green-400' 
                        : ''
                    }`}
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
                        
                        {/* Display Image if exists */}
                        {q.imageUrl && (
                          <div className="my-3">
                            <img 
                              src={q.imageUrl} 
                              alt="Question" 
                              className="max-w-xs max-h-32 rounded border border-slate-500"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                        
                        <p className="text-green-400">Answer: {q.answer}</p>
                        {q.hint && <p className="text-yellow-400">Hint: {q.hint}</p>}
                        
                        {/* Display Links if exist */}
                        {q.links && q.links.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-blue-400 text-sm font-semibold">Links:</p>
                            {q.links.map((link, linkIdx) => (
                              <a
                                key={linkIdx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-300 hover:text-blue-200 text-sm underline"
                              >
                                🔗 {link.text}
                              </a>
                            ))}
                          </div>
                        )}
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

        {activeTab === 'bulk-upload' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaFileUpload /> Bulk Team Registration
              </h2>
              
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-300 mb-2">📋 Instructions:</h3>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                    <li>Download the CSV template below</li>
                    <li>Fill in team names and member details (up to 4 members per team)</li>
                    <li>Upload the completed CSV file</li>
                    <li>Passwords will be automatically generated for each team</li>
                    <li>Download the credentials file to share with teams</li>
                  </ul>
                </div>

                {/* CSV Format Example */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-300 mb-2">CSV Format:</h3>
                  <pre className="text-xs text-slate-400 bg-slate-900 p-3 rounded overflow-x-auto">
{`Team Name, Member 1 Name, Member 1 Contact, Member 2 Name, Member 2 Contact, ...
Team Alpha, John Doe, 1234567890, Jane Smith, 0987654321, Bob Johnson, 1111111111
Team Beta, Mike Brown, 3333333333, Sarah Davis, 4444444444`}
                  </pre>
                </div>

                {/* Download Template Button */}
                <button
                  onClick={downloadCsvTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <FaDownload /> Download CSV Template
                </button>

                {/* File Upload */}
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                  />
                  
                  {!csvFile ? (
                    <div>
                      <FaFileUpload className="mx-auto text-4xl text-slate-500 mb-3" />
                      <p className="text-slate-400 mb-3">Select a CSV file to upload</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-semibold mb-3">
                        📄 {csvFile.name}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleCsvUpload}
                          disabled={csvUploading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {csvUploading ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FaFileUpload /> Upload & Register Teams
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCsvFile(null);
                            setCsvResults(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Display */}
                {csvResults && (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-400 text-sm">Successful</p>
                            <p className="text-white text-2xl font-bold">{csvResults.success.length}</p>
                          </div>
                          <FaCheckCircle className="text-green-400 text-3xl" />
                        </div>
                      </div>
                      
                      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-400 text-sm">Failed</p>
                            <p className="text-white text-2xl font-bold">{csvResults.failed.length}</p>
                          </div>
                          <FaTrash className="text-red-400 text-3xl" />
                        </div>
                      </div>
                      
                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-400 text-sm">Duplicates</p>
                            <p className="text-white text-2xl font-bold">{csvResults.duplicates.length}</p>
                          </div>
                          <FaUsers className="text-yellow-400 text-3xl" />
                        </div>
                      </div>
                    </div>

                    {/* Download Credentials Button */}
                    {csvResults.success.length > 0 && (
                      <button
                        onClick={downloadCredentials}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                      >
                        <FaDownload /> Download Team Credentials
                      </button>
                    )}

                    {/* Successful Registrations */}
                    {csvResults.success.length > 0 && (
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <FaCheckCircle /> Successfully Registered Teams
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-600">
                                <th className="text-left py-2 px-3 text-slate-300 text-sm">Team Name</th>
                                <th className="text-left py-2 px-3 text-slate-300 text-sm">Password</th>
                                <th className="text-left py-2 px-3 text-slate-300 text-sm">Members</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvResults.success.map((team, idx) => (
                                <tr key={idx} className="border-b border-slate-600">
                                  <td className="py-2 px-3 text-white text-sm">{team.teamName}</td>
                                  <td className="py-2 px-3 text-green-400 font-mono text-sm">{team.password}</td>
                                  <td className="py-2 px-3 text-slate-300 text-sm">{team.memberCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Failed Registrations */}
                    {csvResults.failed.length > 0 && (
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-red-400 mb-3">❌ Failed Registrations</h3>
                        <ul className="space-y-2">
                          {csvResults.failed.map((item, idx) => (
                            <li key={idx} className="text-sm text-slate-300">
                              <span className="font-medium">{item.teamName}</span>: {item.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Duplicate Teams */}
                    {csvResults.duplicates.length > 0 && (
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-400 mb-3">⚠️ Duplicate Teams (Skipped)</h3>
                        <ul className="space-y-2">
                          {csvResults.duplicates.map((item, idx) => (
                            <li key={idx} className="text-sm text-slate-300">
                              <span className="font-medium">{item.teamName}</span>: {item.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">🏆 Leaderboard</h2>
              <p className="text-sm text-slate-400">💡 Click on a team to view details</p>
            </div>
            
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
                      onClick={() => handleTeamClick(team)}
                      className={`border-b border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors ${
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
                        {formatTimestamp(team.finishTime)}
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

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeTeamModal}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedTeam.teamName}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedTeam.finishTime 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-blue-900/30 text-blue-400'
                }`}>
                  {selectedTeam.finishTime ? '✅ Completed' : '⏳ In Progress'}
                </span>
              </div>
              <button
                onClick={closeTeamModal}
                className="text-slate-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            {/* Progress Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Current Progress</p>
                <p className="text-white text-xl font-bold">
                  Question {selectedTeam.currentQuestion || 1} / {questions.length}
                </p>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Team ID</p>
                <p className="text-white text-sm font-mono break-all">
                  {selectedTeam.id}
                </p>
              </div>
              
              {selectedTeam.finishTime && (
                <div className="bg-slate-700 rounded-lg p-4 md:col-span-2">
                  <p className="text-slate-400 text-sm mb-1">
                    <FaClock className="inline mr-1" /> Completion Time
                  </p>
                  <p className="text-white font-semibold">
                    {formatTimestamp(selectedTeam.finishTime)}
                  </p>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FaUsers /> Team Members
                {selectedTeam.members && selectedTeam.members.length > 0 && (
                  <span className="text-sm text-slate-400">({selectedTeam.members.length})</span>
                )}
              </h3>
              {selectedTeam.members && selectedTeam.members.length > 0 ? (
                <div className="space-y-3">
                  {selectedTeam.members.map((member, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-700 rounded-lg p-4 flex items-center gap-4"
                    >
                      <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{member.name || 'N/A'}</p>
                        <p className="text-slate-400 text-sm">
                          {member.contact ? `📞 ${member.contact}` : 'No contact provided'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <p className="text-slate-400">No team members registered</p>
                </div>
              )}
            </div>

            {/* Role Info */}
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-slate-400 text-sm mb-1">Role</p>
              <p className="text-white font-semibold capitalize">
                {selectedTeam.role || 'participant'}
              </p>
            </div>

            {/* Checkpoint Information */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FaCheckCircle /> Checkpoint Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Checkpoint 1</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedTeam.checkpoint1Time ? formatTimestamp(selectedTeam.checkpoint1Time) : '—'}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Checkpoint 2</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedTeam.checkpoint2Time ? formatTimestamp(selectedTeam.checkpoint2Time) : '—'}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Checkpoint 3</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedTeam.checkpoint3Time ? formatTimestamp(selectedTeam.checkpoint3Time) : '—'}
                  </p>
                </div>
              </div>
              {selectedTeam.awaitingCheckpoint && (
                <div className="mt-3 bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm font-semibold">
                    ⏳ Awaiting Checkpoint {selectedTeam.awaitingCheckpoint} scan
                  </p>
                </div>
              )}
            </div>

            {/* Pause Status */}
            {selectedTeam.isPaused && (
              <div className="mb-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold flex items-center gap-2">
                  <FaPause /> Game is Currently Paused
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {selectedTeam.role !== 'admin' && (
                <>
                  {selectedTeam.isPaused ? (
                    <button
                      onClick={() => handleUnpauseTeam(selectedTeam.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPlay /> Unpause Game
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePauseTeam(selectedTeam.id)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPause /> Pause Game
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  handleResetTeam(selectedTeam.id);
                  closeTeamModal();
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                🔄 Reset Progress
              </button>
              <button
                onClick={closeTeamModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}