const ApiError = require('../../utils/ApiError');

describe('ApiError', () => {
  it('should create an error with correct properties', () => {
    const error = new ApiError(404, 'Resource not found');
    
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
    expect(error.isOperational).toBe(true);
    expect(error.success).toBe(false);
    expect(error.errors).toEqual([]);
    expect(error.stack).toBeDefined();
  });

  it('should include specific errors if provided', () => {
    const customErrors = [{ field: 'name', message: 'Required' }];
    const error = new ApiError(400, 'Validation failed', customErrors);
    
    expect(error.errors).toEqual(customErrors);
  });
});
