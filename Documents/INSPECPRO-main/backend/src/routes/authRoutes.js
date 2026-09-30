const express = require('express');
const { login, me, atualizarPerfil, alterarSenha } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimitMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.get('/me', protect, asyncHandler(me));
router.put('/perfil', protect, asyncHandler(atualizarPerfil));
router.put('/senha', protect, asyncHandler(alterarSenha));

module.exports = router;
