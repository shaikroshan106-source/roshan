/**
 * sanitize.js — Defensive Input Sanitization Middleware
 * Sanitizes request body, query, and params to prevent XSS and injection attacks.
 */

// Strip HTML tags and control characters from string
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

// Recursively sanitize all strings in an object or array
export function sanitizeData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Don't modify binary buffers or base64 image data strings
      if (typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('data:application/pdf'))) {
        cleaned[key] = value;
      } else {
        cleaned[key] = sanitizeData(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Express middleware to sanitize incoming req.body, req.query, and req.params
 */
export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeData(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeData(req.params);
  }
  next();
}
