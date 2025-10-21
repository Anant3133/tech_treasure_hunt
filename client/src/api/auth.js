import api from './http';

export async function login(teamName, password) {
  const { data } = await api.post('/auth/login', { teamName: String(teamName || '').trim(), password });
  return data; // Return the data with token, let context handle storage
}

export async function register({ teamName, password, role, adminInviteKey }) {
  const { data } = await api.post('/auth/register', { teamName: String(teamName || '').trim(), password, role, adminInviteKey });
  return data; // Return the data with token, let context handle storage
}

export function logout() {
  localStorage.removeItem('auth_token');
}


