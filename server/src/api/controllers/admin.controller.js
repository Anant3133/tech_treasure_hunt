const { body, validationResult, param } = require('express-validator');
const {
  createOrUpdateQuestion,
  deleteQuestionByNumber,
  listQuestions,
  getAllTeamsSorted,
  updateTeamProgress,
} = require('../services/firestore.service');
const { generateToken, DEFAULT_TTL_SECONDS } = require('../services/qr.service');

const upsertQuestionValidations = [
  body('questionNumber').isInt({ min: 1 }).withMessage('questionNumber must be a positive integer'),
  body('text').isString().notEmpty(),
  body('answer').isString().notEmpty(),
  body('hint').isString().optional({ nullable: true }).default(''),
];

async function upsertQuestion(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const created = await createOrUpdateQuestion(req.body);
  res.status(200).json(created);
}

const deleteQuestionValidations = [
  param('questionNumber').isInt({ min: 1 }),
];

async function removeQuestion(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const ok = await deleteQuestionByNumber(Number(req.params.questionNumber));
  if (!ok) return res.status(404).json({ message: 'Question not found' });
  res.json({ success: true });
}

async function getQuestions(req, res) {
  const list = await listQuestions();
  res.json(list);
}

async function getTeams(req, res) {
  const teams = await getAllTeamsSorted();
  const sanitized = teams.map(t => ({ id: t.id, teamName: t.teamName, role: t.role || 'participant', currentQuestion: t.currentQuestion || 0, finishTime: t.finishTime || null }));
  res.json(sanitized);
}

const resetTeamProgressValidations = [
  param('teamId').isString().notEmpty(),
  body('currentQuestion').optional().isInt({ min: 1 }),
];

async function resetTeamProgress(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { teamId } = req.params;
  const { currentQuestion = 1 } = req.body;
  const updated = await updateTeamProgress(teamId, { currentQuestion, finishTime: null });
  res.json({ id: updated.id, currentQuestion: updated.currentQuestion, finishTime: updated.finishTime || null });
}

const getCurrentQrTokenValidations = [
  param('questionNumber').isInt({ min: 1 }),
];

async function getCurrentQrToken(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const q = Number(req.params.questionNumber);
  const token = generateToken(q);
  res.json({ token, ttlSeconds: DEFAULT_TTL_SECONDS, questionNumber: q });
}

module.exports = {
  upsertQuestion,
  upsertQuestionValidations,
  removeQuestion,
  deleteQuestionValidations,
  getQuestions,
  getTeams,
  resetTeamProgress,
  resetTeamProgressValidations,
  getCurrentQrToken,
  getCurrentQrTokenValidations,
};


