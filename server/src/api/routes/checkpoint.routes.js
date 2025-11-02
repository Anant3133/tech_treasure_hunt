const express = require('express');
const { scanCheckpoint, pauseTeam, unpauseTeam } = require('../controllers/checkpoint.controller');
const { protect, adminMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Team scans checkpoint QR (protected route)
router.post('/scan/:checkpointNumber', protect, scanCheckpoint);

// Admin pause/unpause (admin only)
router.post('/pause/:teamId', protect, adminMiddleware, pauseTeam);
router.post('/unpause/:teamId', protect, adminMiddleware, unpauseTeam);

module.exports = router;
