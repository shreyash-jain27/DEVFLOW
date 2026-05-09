const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], error.stack);
  }

  
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ApiError(400, message);
  }

  
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  
  if (err.name === 'ZodError') {
    const issues = err.errors || err.issues || [];
    const message = issues.map(e => e.message).join(', ') || 'Validation Error';
    error = new ApiError(400, message, issues);
  }

  
  logger.error(error.message, { stack: error.stack, url: req.originalUrl, method: req.method });

  
  const response = {
    ...new ApiResponse(error.statusCode, null, error.message),
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  };

  res.status(error.statusCode).json(response);
};

module.exports = {
  globalErrorHandler
};
