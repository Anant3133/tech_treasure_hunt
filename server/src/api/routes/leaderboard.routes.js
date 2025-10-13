const { Router } = require('express');
const { getLeaderboard } = require('../controllers/leaderboard.controller');

const router = Router();

router.get('/', getLeaderboard);

module.exports = router;


