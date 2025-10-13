import api from './http';

export async function login(teamName, password) {
  const { data } = await api.post('/auth/login', { teamName, password });
  if (data?.token) localStorage.setItem('auth_token', data.token);
  return data;
}

export async function register({ teamName, password, role, adminInviteKey }) {
  const { data } = await api.post('/auth/register', { teamName, password, role, adminInviteKey });
  if (data?.token) localStorage.setItem('auth_token', data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('auth_token');
}


