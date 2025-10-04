export const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Google Drive API errors
  if (err.code === 404 && err.message?.includes('File not found')) {
    return res.status(404).json({
      success: false,
      message: 'User data not found'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: message.join(', ')
    });
  }

  // Google API quota exceeded
  if (err.code === 403 && err.message?.includes('quota')) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again later.'
    });
  }

  // Default server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};