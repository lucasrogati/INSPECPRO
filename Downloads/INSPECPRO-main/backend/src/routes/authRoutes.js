const express = require('express');
const { login, me, atualizarPerfil, alterarSenha } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));
router.put('/perfil', protect, asyncHandler(atualizarPerfil));
router.put('/senha', protect, asyncHandler(alterarSenha));

module.exports = router;
