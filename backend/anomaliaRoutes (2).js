const express = require('express');
const { listar, obter, criar, atualizar, remover } = require('../controllers/usuarioController');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Toda a gestão de usuários é restrita ao perfil administrador.
router.use(protect, authorize('administrador'));

router.get('/', asyncHandler(listar));
router.get('/:id', asyncHandler(obter));
router.post('/', asyncHandler(criar));
router.put('/:id', asyncHandler(atualizar));
router.delete('/:id', asyncHandler(remover));

module.exports = router;
