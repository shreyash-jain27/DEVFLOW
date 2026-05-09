const rateLimit = require('express-rate-limit');
const logger    = require('../utils/logger');



const buildStore = (prefix) => {
  if (process.env.NODE_ENV === 'test') return undefined; 

  try {
    const { RedisStore } = require('rate-limit-redis');
    const redis = require('../config/redis');

    
    if (redis.status !== 'ready' && redis.status !== 'connecting' && redis.status !== 'connect') {
       throw new Error('Redis not ready');
    }

    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    logger.warn(`[RateLimit] Using memory store for "${prefix}" (Redis unavailable: ${err.message})`);
    return undefined; 
  }
};


const rateLimitHandler = (req, res, _next, options) => {
  logger.warn(`[RateLimit] Limit hit — IP: ${req.ip}, URL: ${req.originalUrl}, Limit: ${options.max}`);
  res.status(options.statusCode).json({
    message:    options.message.message,
    retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
  });
};



const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, 
  max:            5,
  standardHeaders: 'draft-7',
  legacyHeaders:  false,
  store:          buildStore('auth'),
  handler:        rateLimitHandler,
  message:        { message: 'Too many attempts from this IP. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  validate: { ip: false },
  skip: () => process.env.NODE_ENV === 'test',
});


const apiLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            100,
  standardHeaders: 'draft-7',
  legacyHeaders:  false,
  store:          buildStore('api'),
  handler:        rateLimitHandler,
  message:        { message: 'Too many requests from this IP. Please try again in 15 minutes.' },
  validate: { ip: false },
  skip: () => process.env.NODE_ENV === 'test',
});


const aiLimiter = rateLimit({
  windowMs:       60 * 60 * 1000, 
  max:            10,
  standardHeaders: 'draft-7',
  legacyHeaders:  false,
  store:          buildStore('ai'),
  handler:        rateLimitHandler,
  message:        { message: 'AI request limit reached. Please try again after an hour.' },
  validate:       { ip: false },
  skip:           () => process.env.NODE_ENV === 'test',
});

module.exports = { apiLimiter, aiLimiter, authLimiter };
