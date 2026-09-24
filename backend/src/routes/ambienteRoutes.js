const express = require('express');
const { listar, obter, criar, atualizar, remover } = require('../controllers/ambienteController');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(listar));
router.get('/:id', asyncHandler(obter));

router.post('/', authorize('administrador', 'gestor'), asyncHandler(criar));
router.put('/:id', authorize('administrador', 'gestor'), asyncHandler(atualizar));
router.delete('/:id', authorize('administrador', 'gestor'), asyncHandler(remover));

module.exports = router;
