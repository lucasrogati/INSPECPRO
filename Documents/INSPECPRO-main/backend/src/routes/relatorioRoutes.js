const express = require('express');
const { anomalias, manutencoes } = require('../controllers/relatorioController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);
router.get('/anomalias', asyncHandler(anomalias));
router.get('/manutencoes', asyncHandler(manutencoes));

module.exports = router;
