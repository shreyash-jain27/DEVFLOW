const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');


router.post('/register',       validate(registerSchema), register);
router.post('/login',          validate(loginSchema),    login);
router.post('/refresh-token',  refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);


router.use(auth);
router.post('/logout',     logout);
router.post('/logout-all', logoutAll);

module.exports = router;

