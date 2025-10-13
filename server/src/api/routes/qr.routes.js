const { Router } = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { resolveToken } = require('../controllers/qr.controller');

const router = Router();

router.post('/resolve/:token', protect, resolveToken);

module.exports = router;


