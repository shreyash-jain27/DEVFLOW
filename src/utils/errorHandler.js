// Custom Error Class to handle operational errors explicitly
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates an expected error (e.g., bad request, not found)

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Handling Middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for developer (you could use a logger like Winston here)
  console.error(err);

  // Handle Mongoose bad ObjectId error
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 404);
  }

  // Handle Mongoose duplicate key error (e.g., unique email)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Send Response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    // Only send the stack trace if we're not in production mode
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }) 
  });
};

module.exports = {
  AppError,
  globalErrorHandler
};
