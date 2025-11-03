import api from './http';

// Scan checkpoint QR code
export async function scanCheckpoint(checkpointNumber) {
  const { data } = await api.post(`/checkpoint/scan/${checkpointNumber}`);
  return data;
}

// Admin: Pause a team
export async function pauseTeam(teamId) {
  const { data } = await api.post(`/checkpoint/pause/${teamId}`);
  return data;
}

// Admin: Unpause a team
export async function unpauseTeam(teamId) {
  const { data } = await api.post(`/checkpoint/unpause/${teamId}`);
  return data;
}

// Admin: Unpause all teams
export async function unpauseAllTeams() {
  const { data } = await api.post('/checkpoint/unpause-all');
  return data;
}
