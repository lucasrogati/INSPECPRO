const express = require('express');
const { listar, obter, criar, atualizar, alterarStatus, remover } = require('../controllers/inspecaoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// Leitura: qualquer usuário autenticado pode visualizar (inclusive manutenção/gestor).
router.get('/', asyncHandler(listar));
router.get('/:id', asyncHandler(obter));

// Escrita: administrador e gestor gerenciam; engenheiro pode criar e atualizar.
router.post('/', authorize('administrador', 'gestor', 'engenheiro'), asyncHandler(criar));
router.put('/:id', authorize('administrador', 'gestor', 'engenheiro'), asyncHandler(atualizar));
router.patch('/:id/status', authorize('administrador', 'gestor', 'engenheiro'), asyncHandler(alterarStatus));

// Exclusão: apenas administrador e gestor.
router.delete('/:id', authorize('administrador', 'gestor'), asyncHandler(remover));

module.exports = router;
