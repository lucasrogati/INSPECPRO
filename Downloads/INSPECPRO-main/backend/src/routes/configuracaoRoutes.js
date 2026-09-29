const express = require('express');
const { sistema } = require('../controllers/configuracaoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/sistema', protect, authorize('administrador'), asyncHandler(sistema));

module.exports = router;
