const express = require('express');
const {
  listar,
  listarResponsaveis,
  obter,
  criar,
  atualizar,
  alterarStatus,
  verificar,
  remover,
  adicionarFotos,
  removerFoto,
} = require('../controllers/anomaliaController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadFotos } = require('../middleware/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// Leitura: qualquer usuário autenticado.
router.get('/', asyncHandler(listar));
router.get('/responsaveis', asyncHandler(listarResponsaveis)); // antes de "/:id"
router.get('/:id', asyncHandler(obter));

// Escrita: administrador, gestor e engenheiro (mesmo critério das inspeções).
const gestao = authorize('administrador', 'gestor', 'engenheiro');
router.post('/', gestao, asyncHandler(criar));
router.put('/:id', gestao, asyncHandler(atualizar));
router.patch('/:id/status', gestao, asyncHandler(alterarStatus));
router.post('/:id/verificar', gestao, asyncHandler(verificar));

// Fotos: quem executa a manutenção também pode anexar evidências.
router.post('/:id/fotos', authorize('administrador', 'gestor', 'engenheiro', 'manutencao'), uploadFotos, asyncHandler(adicionarFotos));
router.delete('/:id/fotos/:fotoId', gestao, asyncHandler(removerFoto));

// Exclusão: apenas administrador e gestor.
router.delete('/:id', authorize('administrador', 'gestor'), asyncHandler(remover));

module.exports = router;
