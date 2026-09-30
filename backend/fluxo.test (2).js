const express = require('express');
const { obter } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);
router.get('/', asyncHandler(obter));

module.exports = router;
