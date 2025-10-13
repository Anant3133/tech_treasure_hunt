const { Router } = require('express');
const { register, registerValidations, login, loginValidations } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', registerValidations, register);
router.post('/login', loginValidations, login);

module.exports = router;


