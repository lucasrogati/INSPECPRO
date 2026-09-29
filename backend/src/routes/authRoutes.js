const express = require('express');
const { login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));

module.exports = router;
