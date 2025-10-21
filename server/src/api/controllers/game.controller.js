const { body, validationResult } = require('express-validator');
const {
  findTeamById,
  getQuestion,
  updateTeamProgress,
} = require('../services/firestore.service');

async function getQuestionController(req, res) {
  const { teamId } = req.team;
  const { questionNumber } = req.params;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  if (Number(team.currentQuestion) !== Number(questionNumber)) {
    return res.status(403).json({ message: 'Forbidden: Not your current question' });
  }

  const question = await getQuestion(questionNumber);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  return res.json({ questionNumber: question.questionNumber, text: question.text });
}

const submitAnswerValidations = [
  body('submittedAnswer').notEmpty().withMessage('submittedAnswer is required'),
];

async function submitAnswerController(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { teamId } = req.team;
  const { submittedAnswer } = req.body;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const currentQuestionNumber = Number(team.currentQuestion);
  const question = await getQuestion(currentQuestionNumber);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const isCorrect = String(submittedAnswer).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
  if (!isCorrect) {
    return res.status(400).json({ message: 'Incorrect answer' });
  }

  const nextQuestionNumber = currentQuestionNumber + 1;
  const now = new Date();

  // Check if this is the last question (question 10)
  const isLastQuestion = currentQuestionNumber >= 10;
  
  if (isLastQuestion) {
    // This was the final question - mark as finished
    const updatedTeam = await updateTeamProgress(teamId, {
      currentQuestion: currentQuestionNumber,
      lastCorrectAnswerTimestamp: now,
      finishTime: now,
    });
    return res.json({
      correct: true,
      finished: true,
      nextHint: null,
      currentQuestion: updatedTeam.currentQuestion,
    });
  }

  // Not the last question - require QR scan to advance
  await updateTeamProgress(teamId, {
    lastCorrectAnswerTimestamp: now,
    awaitingQrScanForQuestion: currentQuestionNumber,
  });

  // Get the next question's hint
  const nextQuestion = await getQuestion(nextQuestionNumber);
  
  return res.json({
    correct: true,
    finished: false,
    requiresQrScan: true,
    qrForQuestion: currentQuestionNumber,
    nextHint: nextQuestion ? nextQuestion.hint : null,
    currentQuestion: currentQuestionNumber,
  });
}

async function getTeamProgressController(req, res) {
  const { teamId } = req.team;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  return res.json({
    currentQuestion: team.currentQuestion || 1,
    finishTime: team.finishTime || null,
    hasStarted: (team.currentQuestion || 1) > 1 || team.lastCorrectAnswerTimestamp !== null
  });
}

module.exports = {
  getQuestion: getQuestionController,
  submitAnswer: submitAnswerController,
  submitAnswerValidations,
  getTeamProgress: getTeamProgressController,
};


