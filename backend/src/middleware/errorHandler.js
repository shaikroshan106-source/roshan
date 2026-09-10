/**
 * errorHandler.js — Centralized Defensive Error Handling Middleware
 * Prevents information disclosure, masks internal DB exceptions, and standardizes responses.
 */
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Log detailed error internally
  console.error('🔥 [Server Error]:', err.stack || err.message || err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Multer upload errors cleanly
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'Uploaded file exceeds the maximum allowed size (10MB).';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded in a single request.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // Handle CORS rejection
  if (message.includes('CORS policy')) {
    statusCode = 403;
  }

  // Mask internal server / database error messages in production
  if (statusCode >= 500 && !isDev) {
    message = 'An internal system error occurred. Please try again or contact AgriDirect Support.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev ? { stack: err.stack } : {}),
  });
}
