const { getAllTeamsSorted } = require('../services/firestore.service');

async function getLeaderboard(req, res) {
  const teams = await getAllTeamsSorted();
  // Filter out admin teams
  const filtered = teams.filter(t => t.role !== 'admin');
  const sanitized = filtered.map(t => ({
    id: t.id,
    teamName: t.teamName,
    currentQuestion: t.currentQuestion || 0,
    lastCorrectAnswerTimestamp: t.lastCorrectAnswerTimestamp || null,
    finishTime: t.finishTime || null,
  }));
  res.json(sanitized);
}

module.exports = { getLeaderboard };


