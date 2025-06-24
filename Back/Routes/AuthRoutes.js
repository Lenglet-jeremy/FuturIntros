// AuthRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../Controllers/AuthController.js');
const authenticate = require('../Middlewares/AuthMiddlewares.js');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification-code', authController.resendCode);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
