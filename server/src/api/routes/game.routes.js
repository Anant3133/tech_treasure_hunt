const { Router } = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getQuestion, submitAnswer, submitAnswerValidations } = require('../controllers/game.controller');

const router = Router();

router.post('/question/:questionNumber', protect, getQuestion);
router.post('/submit-answer', protect, submitAnswerValidations, submitAnswer);

module.exports = router;


