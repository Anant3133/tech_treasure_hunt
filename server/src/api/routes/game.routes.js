const { Router } = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getQuestion, submitAnswer, submitAnswerValidations, getTeamProgress, getTeamInfo } = require('../controllers/game.controller');

const router = Router();

router.get('/progress', protect, getTeamProgress);
router.get('/team', protect, getTeamInfo);
router.post('/question/:questionNumber', protect, getQuestion);
router.post('/submit-answer', protect, submitAnswerValidations, submitAnswer);

module.exports = router;


