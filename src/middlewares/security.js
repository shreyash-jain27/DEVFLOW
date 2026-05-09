const helmet       = require('helmet');
const cors         = require('cors');
const hpp          = require('hpp');
const logger       = require('../utils/logger');
const sanitizeHtml = require('sanitize-html');


const deepSanitize = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = deepSanitize(obj[i]);
    }
  } else {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        obj[key] = deepSanitize(obj[key]);
      }
    }
  }
  return obj;
};

const nosqlSanitizer = (req, _res, next) => {
  if (req.body)   deepSanitize(req.body);
  if (req.query)  deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);
  next();
};


const xssSanitize = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeHtml(obj[key], {
        allowedTags: [],
        allowedAttributes: {},
      });
    } else if (typeof obj[key] === 'object') {
      xssSanitize(obj[key]);
    }
  }
  return obj;
};

const xssMiddleware = (req, _res, next) => {
  if (req.body) xssSanitize(req.body);
  next();
};



const buildCorsOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';

  const allowedOrigins = isProd
    ? (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://127.0.0.1:3000',
      ];

  return {
    origin: (incomingOrigin, callback) => {
      
      if (!incomingOrigin) return callback(null, true);

      if (allowedOrigins.includes(incomingOrigin)) {
        return callback(null, true);
      }

      logger.warn(`[CORS] Blocked request from disallowed origin: ${incomingOrigin}`);
      return callback(new Error(`CORS policy: origin "${incomingOrigin}" not allowed`));
    },
    credentials: true,  
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Cache', 'X-Cache-Key', 'RateLimit-Limit', 'RateLimit-Remaining'],
    maxAge: 86400, 
  };
};



const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc:         ["'self'", "data:", "https://*"],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
      objectSrc:      ["'none'"],
      mediaSrc:       ["'self'"],
      frameSrc:       ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,   
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge:            31_536_000, 
    includeSubDomains: true,
    preload:           true,
  },
};



const trimStrings = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object') {
      trimStrings(obj[key]);
    }
  }
  return obj;
};

const bodyTrimmer = (req, _res, next) => {
  if (req.body) trimStrings(req.body);
  next();
};




const HPP_WHITELIST = ['sort', 'fields', 'page', 'limit', 'status', 'priority', 'populate'];



const applySecurityMiddleware = (app) => {
  
  app.use(helmet(helmetOptions));

  
  app.use(cors(buildCorsOptions()));

  
  app.use(nosqlSanitizer);

  
  app.use(xssMiddleware);

  
  app.use(hpp({ whitelist: HPP_WHITELIST }));

  
  app.use(bodyTrimmer);

  logger.info('[Security] All security middleware applied');
};

module.exports = { applySecurityMiddleware };
