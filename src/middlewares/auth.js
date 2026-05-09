const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    let token;
    
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError(401, 'Not authorized, token missing'));
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized, user not found'));
    }

    
    next();
  } catch (error) {
    logger.error('Auth Middleware Error:', { error: error.message });
    next(new ApiError(401, 'Not authorized, token failed'));
  }
};

module.exports = auth;
