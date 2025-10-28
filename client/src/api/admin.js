import api from './http';

export async function getCurrentQrToken(questionNumber) {
  const { data } = await api.get(`/admin/qr/current/${questionNumber}`);
  return data; // { token, ttlSeconds, questionNumber }
}

export async function getLeaderboard() {
  const { data } = await api.get('/leaderboard');
  return data;
}

export async function bulkRegisterTeams(csvContent) {
  const { data } = await api.post('/admin/bulk-register', { csvContent });
  return data; // { success: [], failed: [], duplicates: [] }
}

