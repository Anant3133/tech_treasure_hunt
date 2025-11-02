const { Router } = require('express');
const authRoutes = require('./auth.routes');
const gameRoutes = require('./game.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const adminRoutes = require('./admin.routes');
const qrRoutes = require('./qr.routes');
const checkpointRoutes = require('./checkpoint.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);
router.use('/qr', qrRoutes);
router.use('/checkpoint', checkpointRoutes);

module.exports = router;


