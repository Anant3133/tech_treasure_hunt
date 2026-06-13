const { Router } = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getAnswer, getQrToken, unpauseTeam, resetTeam } = require('../controllers/showcase.controller');

const router = Router();

// Apply auth middleware to all showcase endpoints
router.use(protect);

router.get('/answer', getAnswer);
router.get('/qr-token', getQrToken);
router.post('/unpause', unpauseTeam);
router.post('/reset', resetTeam);

module.exports = router;
