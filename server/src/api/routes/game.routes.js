const { Router } = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getQuestion, submitAnswer, submitAnswerValidations, getTeamProgress } = require('../controllers/game.controller');

const router = Router();

router.get('/progress', protect, getTeamProgress);
router.post('/question/:questionNumber', protect, getQuestion);
router.post('/submit-answer', protect, submitAnswerValidations, submitAnswer);

module.exports = router;


