const { verifyToken } = require('../services/qr.service');
const { findTeamById, getQuestion, updateTeamProgress } = require('../services/firestore.service');

async function resolveToken(req, res) {
  const { token } = req.params;
  const { teamId } = req.team;

  const verification = verifyToken(token);
  if (!verification.valid) {
    return res.status(400).json({ message: 'Invalid or expired QR token', reason: verification.reason });
  }
  const q = Number(verification.questionNumber);

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  if (Number(team.currentQuestion) !== q) {
    return res.status(403).json({ message: 'Forbidden: Token not for your current question' });
  }
  if (Number(team.awaitingQrScanForQuestion || 0) !== q) {
    return res.status(400).json({ message: 'No QR scan expected for this team/question' });
  }

  const currentQuestion = await getQuestion(q);
  if (!currentQuestion) return res.status(404).json({ message: 'Question not found' });

  const nextQuestionNumber = q + 1;
  const now = new Date();
  const nextQuestion = await getQuestion(nextQuestionNumber);
  const updates = {
    currentQuestion: nextQuestion ? nextQuestionNumber : q,
    lastCorrectAnswerTimestamp: now,
    finishTime: nextQuestion ? team.finishTime || null : now,
    awaitingQrScanForQuestion: null,
  };

  const updatedTeam = await updateTeamProgress(teamId, updates);

  return res.json({
    advanced: true,
    finished: !nextQuestion,
    currentQuestion: updatedTeam.currentQuestion,
  });
}

module.exports = { resolveToken };


