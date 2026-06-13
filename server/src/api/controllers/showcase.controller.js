const { findTeamById, getQuestion, updateTeamProgress } = require('../services/firestore.service');
const { generateToken } = require('../services/qr.service');

async function getAnswer(req, res) {
  try {
    const { teamId } = req.team;
    const team = await findTeamById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const question = await getQuestion(team.currentQuestion);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    return res.json({ answer: question.answer });
  } catch (error) {
    console.error('[ShowcaseController] getAnswer error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getQrToken(req, res) {
  try {
    const { teamId } = req.team;
    const team = await findTeamById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Generate a valid dynamic token for the current question
    const token = generateToken(team.currentQuestion);
    return res.json({ token });
  } catch (error) {
    console.error('[ShowcaseController] getQrToken error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function unpauseTeam(req, res) {
  try {
    const { teamId } = req.team;
    await updateTeamProgress(teamId, {
      isPaused: false,
      awaitingCheckpoint: null,
    });
    return res.json({ message: 'Team unpaused successfully' });
  } catch (error) {
    console.error('[ShowcaseController] unpauseTeam error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function resetTeam(req, res) {
  try {
    const { teamId } = req.team;
    await updateTeamProgress(teamId, {
      currentQuestion: 1,
      lastCorrectAnswerTimestamp: null,
      finishTime: null,
      isPaused: false,
      awaitingCheckpoint: null,
      awaitingQrScanForQuestion: null,
      checkpoint1Time: null,
      checkpoint2Time: null,
      checkpoint3Time: null,
    });
    return res.json({ message: 'Team progress reset successfully' });
  } catch (error) {
    console.error('[ShowcaseController] resetTeam error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getAnswer,
  getQrToken,
  unpauseTeam,
  resetTeam,
};
