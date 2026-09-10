import crypto from 'crypto';

/**
 * Hash password with PBKDF2 and cryptographically secure random salt
 * @param {string} password
 * @returns {string} salt:derivedKey
 */
export function hashPassword(password) {
  if (!password) return null;
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify password against stored salt:derivedKey
 * @param {string} password
 * @param {string} storedHash
 * @returns {boolean}
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Strip sensitive credentials from user objects before sending over API
 * @param {Object} user
 * @returns {Object} Clean user object
 */
export function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return user;
  const clean = { ...user };
  delete clean.password;
  delete clean.passwordHash;
  delete clean.salt;
  delete clean.__v;
  return clean;
}
