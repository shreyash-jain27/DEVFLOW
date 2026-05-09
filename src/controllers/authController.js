const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
const { audit } = require('../services/audit.service');


const generateAccessToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: '15m', 
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const setTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};


const cleanExpiredTokens = (user) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  user.refreshTokens = user.refreshTokens.filter(rt => rt.createdAt >= sevenDaysAgo);
};




const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError(400, 'User already exists'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword, role });

    const accessToken  = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken();

    user.refreshTokens.push({ token: hashToken(refreshToken) });
    await user.save();

    setTokenCookie(res, refreshToken);
    sendWelcomeEmail(user);
    audit(req, 'REGISTER', 'User', user._id);

    res.status(201).json({
      _id: user.id, name: user.name, email: user.email, role: user.role,
      accessToken, refreshToken,
    });
  } catch (error) {
    next(error);
  }
};




const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    
    if (!user) {
      audit(req, 'LOGIN_FAILED', 'User', null, { email });
      return next(new ApiError(401, 'Invalid email or password'));
    }

    
    if (user.isLocked) {
      audit(req, 'ACCOUNT_LOCKED', 'User', user._id);
      return res.status(423).json({
        message:    'Account is temporarily locked due to too many failed login attempts.',
        retryAfter: user.lockUntil.toISOString(),
      });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      
      await user.incrementLoginAttempts();
      audit(req, 'LOGIN_FAILED', 'User', user._id, { attempts: user.loginAttempts + 1 });

      
      const refreshedUser = await User.findById(user._id);
      if (refreshedUser.isLocked) {
        return res.status(423).json({
          message:    'Account locked after too many failed attempts. Try again in 2 hours.',
          retryAfter: refreshedUser.lockUntil.toISOString(),
        });
      }

      return next(new ApiError(401, 'Invalid email or password'));
    }

    
    await user.resetLoginAttempts();
    cleanExpiredTokens(user);

    const accessToken  = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken();

    user.refreshTokens.push({ token: hashToken(refreshToken) });
    await user.save();

    setTokenCookie(res, refreshToken);
    audit(req, 'LOGIN', 'User', user._id);

    res.json({
      _id: user.id, name: user.name, email: user.email, role: user.role,
      accessToken, refreshToken,
    });
  } catch (error) {
    next(error);
  }
};




const refreshToken = async (req, res, next) => {
  try {
    
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return next(new ApiError(401, 'Refresh token required'));
    }

    const hashedToken = hashToken(token);

    
    const user = await User.findOne({ 'refreshTokens.token': hashedToken });

    if (!user) {
      return next(new ApiError(403, 'Invalid refresh token'));
    }

    
    const newAccessToken = generateAccessToken(user._id, user.email, user.role);

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};




const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      const hashedToken = hashToken(token);
      req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt.token !== hashedToken);
      await req.user.save();
    }

    audit(req, 'LOGOUT', 'User', req.user._id);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};




const logoutAll = async (req, res, next) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out of all devices successfully' });
  } catch (error) {
    next(error);
  }
};




const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    sendPasswordResetEmail(user, rawToken);
    audit(req, 'PASSWORD_RESET', 'User', user._id, { step: 'requested' });

    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};




const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return next(new ApiError(400, 'Password must be at least 8 characters'));
    }

    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() }, 
    });

    if (!user) {
      return next(new ApiError(400, 'Reset token is invalid or has expired'));
    }

    
    const salt = await bcrypt.genSalt(10);
    user.password             = await bcrypt.hash(password, salt);
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    user.refreshTokens        = []; 
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
};
