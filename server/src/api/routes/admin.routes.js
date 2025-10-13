const { Router } = require('express');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');
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
} = require('../controllers/admin.controller');

const router = Router();

router.use(protect, authorizeRoles('admin'));

router.get('/questions', getQuestions);
router.post('/questions', upsertQuestionValidations, upsertQuestion);
router.delete('/questions/:questionNumber', deleteQuestionValidations, removeQuestion);

router.get('/teams', getTeams);
router.post('/teams/:teamId/reset', resetTeamProgressValidations, resetTeamProgress);

router.get('/qr/current/:questionNumber', getCurrentQrTokenValidations, getCurrentQrToken);

module.exports = router;


