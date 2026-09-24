const express = require('express');
const { listar, obter, criar, atualizar, remover } = require('../controllers/predioController');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// Leitura: qualquer usuário autenticado.
router.get('/', asyncHandler(listar));
router.get('/:id', asyncHandler(obter));

// Escrita: apenas administrador e gestor.
router.post('/', authorize('administrador', 'gestor'), asyncHandler(criar));
router.put('/:id', authorize('administrador', 'gestor'), asyncHandler(atualizar));
router.delete('/:id', authorize('administrador'), asyncHandler(remover));

module.exports = router;
