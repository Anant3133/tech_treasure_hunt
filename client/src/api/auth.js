import api from './http';

export async function login(teamName, password) {
  const { data } = await api.post('/auth/login', { teamName: String(teamName || '').trim(), password });
  return data; // Return the data with token, let context handle storage
}

export async function register({ teamName, password, members, role, adminInviteKey }) {
  const payload = { teamName: String(teamName || '').trim(), password };
  if (Array.isArray(members)) payload.members = members;
  if (role) payload.role = role;
  if (adminInviteKey) payload.adminInviteKey = adminInviteKey;
  const { data } = await api.post('/auth/register', payload);
  return data; // Return the data with token, let context handle storage
}

export function logout() {
  localStorage.removeItem('auth_token');
}


