const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const protect = require('../middleware/auth'); // Auth middleware

// Login route
router.post('/login', login);

// Logout route
router.post('/logout', protect, logout);

module.exports = router;