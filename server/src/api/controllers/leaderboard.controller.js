const { getAllTeamsSorted } = require('../services/firestore.service');

async function getLeaderboard(req, res) {
  const teams = await getAllTeamsSorted();
  const sanitized = teams.map(t => ({
    id: t.id,
    teamName: t.teamName,
    currentQuestion: t.currentQuestion || 0,
    lastCorrectAnswerTimestamp: t.lastCorrectAnswerTimestamp || null,
    finishTime: t.finishTime || null,
  }));
  res.json(sanitized);
}

module.exports = { getLeaderboard };


