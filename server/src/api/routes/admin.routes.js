// src/api/routes/admin.routes.js

const { Router } = require('express');
const { protect, adminMiddleware } = require('../middlewares/auth.middleware');
const {
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
  getQRImage,
  getQRImageValidations,
  getQRPreview
} = require('../controllers/admin.controller');

const router = Router();

// Protect all admin routes
router.use(protect, adminMiddleware);

// Questions routes
router.get('/questions', getQuestions);
router.post('/questions', upsertQuestionValidations, upsertQuestion);
router.delete('/questions/:questionNumber', deleteQuestionValidations, removeQuestion);
router.delete('/questions/id/:questionId', require('../controllers/admin.controller').removeQuestionById);

// Teams routes
router.get('/teams', getTeams);
router.post('/teams/:teamId/reset', resetTeamProgressValidations, resetTeamProgress);

// QR routes
router.get('/qr/current/:questionNumber', getCurrentQrTokenValidations, getCurrentQrToken);
router.get('/qr/image/:questionNumber', getQRImageValidations, getQRImage);
router.get('/qr/preview/:questionNumber', getQRPreview);  // No validation needed

module.exports = router;
