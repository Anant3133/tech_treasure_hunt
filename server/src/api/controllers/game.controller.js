const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const {
  findTeamById,
  getQuestion,
  updateTeamProgress,
  getTotalQuestionCount,
} = require('../services/firestore.service');
const questionCache = require('../services/questionCache');

async function getQuestionController(req, res) {
  const { teamId } = req.team;
  const { questionNumber } = req.params;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  console.log(`[getQuestion] Team ${team.teamName} requesting Q${questionNumber}, currentQuestion: ${team.currentQuestion}`);

  if (Number(team.currentQuestion) !== Number(questionNumber)) {
    console.log(`[getQuestion] Forbidden: team.currentQuestion=${team.currentQuestion}, requested=${questionNumber}`);
    return res.status(403).json({ message: 'Forbidden: Not your current question' });
  }

  // Try cache first
  let question = questionCache.get(String(questionNumber));
  if (!question) {
    question = await getQuestion(questionNumber);
    if (!question) {
      console.log(`[getQuestion] Question ${questionNumber} not found in database`);
      return res.status(404).json({ message: 'Question not found' });
    }
    questionCache.set(String(questionNumber), question);
  }
  console.log(`[getQuestion] Returning Q${questionNumber} to team ${team.teamName}`);
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
  const now = admin.firestore.Timestamp.now();

  // Get total question count to dynamically determine the last question
  const totalQuestions = await getTotalQuestionCount();
  
  // Check if this is the last question (dynamically based on total questions in DB)
  const isLastQuestion = currentQuestionNumber >= totalQuestions;
  
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

  // Return the CURRENT question's hint (to help find the QR code for this question)
  // The hint should guide them to the QR location for the question they just answered
  
  return res.json({
    correct: true,
    finished: false,
    requiresQrScan: true,
    qrForQuestion: currentQuestionNumber,
    nextHint: question.hint || null, // Use current question's hint, not next question
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

// Return basic team info (name and members) for the authenticated team
async function getTeamInfoController(req, res) {
  const { teamId } = req.team;

  const team = await findTeamById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  // Only expose non-sensitive fields
  const { teamName, members } = team;
  return res.json({ teamName: teamName || null, members: members || [] });
}

module.exports = {
  getQuestion: getQuestionController,
  submitAnswer: submitAnswerController,
  submitAnswerValidations,
  getTeamProgress: getTeamProgressController,
  getTeamInfo: getTeamInfoController,
};


