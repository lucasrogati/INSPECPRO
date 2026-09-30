const express = require('express');
const { listar } = require('../controllers/notificacaoController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', protect, asyncHandler(listar));

module.exports = router;
