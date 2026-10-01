const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth, changePassword, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/change-password', protect, changePassword);
router.get('/users', protect, adminOnly, getAllUsers);

module.exports = router;