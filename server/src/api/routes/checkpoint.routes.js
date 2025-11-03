const express = require('express');
const { scanCheckpoint, pauseTeam, unpauseTeam, unpauseAllTeams } = require('../controllers/checkpoint.controller');
const { protect, adminMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Team scans checkpoint QR (protected route)
router.post('/scan/:checkpointNumber', protect, scanCheckpoint);

// Admin pause/unpause (admin only)
router.post('/pause/:teamId', protect, adminMiddleware, pauseTeam);
router.post('/unpause/:teamId', protect, adminMiddleware, unpauseTeam);
router.post('/unpause-all', protect, adminMiddleware, unpauseAllTeams);

module.exports = router;
