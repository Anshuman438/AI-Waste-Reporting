const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/change-password', protect, changePassword);

module.exports = router;