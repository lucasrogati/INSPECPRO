const express = require('express');
const { listar, obter, criar, atualizar, alterarStatus, remover } = require('../controllers/manutencaoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// Leitura: qualquer usuário autenticado.
router.get('/', asyncHandler(listar));
router.get('/:id', asyncHandler(obter));

// Agendar e editar: administrador, gestor e engenheiro.
router.post('/', authorize('administrador', 'gestor', 'engenheiro'), asyncHandler(criar));
router.put('/:id', authorize('administrador', 'gestor', 'engenheiro'), asyncHandler(atualizar));

// Iniciar/concluir: também o responsável pela manutenção (perfil "manutencao"; validado no controller).
router.patch('/:id/status', authorize('administrador', 'gestor', 'engenheiro', 'manutencao'), asyncHandler(alterarStatus));

// Exclusão: apenas administrador e gestor.
router.delete('/:id', authorize('administrador', 'gestor'), asyncHandler(remover));

module.exports = router;
