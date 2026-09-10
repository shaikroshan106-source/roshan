import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { bucket, isFirebaseConnected } from '../config/firebase.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed folders to prevent path traversal
const ALLOWED_FOLDERS = new Set(['produce-images', 'complaint-evidence', 'documents', 'profiles']);

/**
 * Validate magic bytes / file signature to verify true file format
 * @param {Buffer} buffer
 * @param {string} ext
 * @returns {boolean}
 */
function validateMagicBytes(buffer, ext) {
  if (!buffer || buffer.length < 4) return false;

  const hex = buffer.slice(0, 8).toString('hex').toLowerCase();

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      // JPEG starts with FF D8 FF
      return hex.startsWith('ffd8ff');
    case '.png':
      // PNG starts with 89 50 4E 47
      return hex.startsWith('89504e47');
    case '.webp':
      // WEBP starts with RIFF (52 49 46 46) ... WEBP (57 45 42 50)
      return buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
             buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case '.pdf':
      // PDF starts with %PDF (25 50 44 46)
      return hex.startsWith('25504446');
    default:
      return false;
  }
}

export const storageService = {
  /**
   * Securely upload file buffer to Firebase Storage or local sanitized folder
   * @param {Object} file - Multer file object
   * @param {string} destinationFolder - Destination subfolder
   */
  async uploadFile(file, destinationFolder = 'produce-images') {
    if (!file || !file.buffer) return null;

    // 1. Sanitize destination folder to prevent path traversal (../../)
    const cleanFolder = ALLOWED_FOLDERS.has(destinationFolder) ? destinationFolder : 'produce-images';

    // 2. Validate file extension and magic signature
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const isSignatureValid = validateMagicBytes(file.buffer, ext);
    if (!isSignatureValid) {
      throw new Error(`File contents do not match declared extension (${ext}). Upload rejected for security reasons.`);
    }

    // 3. Cryptographically random, collision-resistant filename
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeFieldName = (file.fieldname || 'upload').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeFieldName}-${Date.now()}-${randomHex}${ext}`;
    const destinationPath = `${cleanFolder}/${filename}`;

    // 4. If Firebase Storage is connected, upload to Firebase Storage bucket
    if (isFirebaseConnected && bucket) {
      try {
        const fileRef = bucket.file(destinationPath);
        await fileRef.save(file.buffer, {
          metadata: { contentType: file.mimetype },
          resumable: false,
        });

        try {
          await fileRef.makePublic();
          return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
        } catch {
          const [signedUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
          });
          return signedUrl;
        }
      } catch (err) {
        console.warn('[Firebase Storage upload error, falling back to local static]:', err.message);
      }
    }

    // 5. Local sandboxed storage fallback
    const targetFolder = path.join(UPLOADS_DIR, cleanFolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Strict path resolution check to prevent directory escape
    const localFilePath = path.join(targetFolder, filename);
    if (!localFilePath.startsWith(UPLOADS_DIR)) {
      throw new Error('Directory traversal attempt detected.');
    }

    fs.writeFileSync(localFilePath, file.buffer);
    return `/uploads/${cleanFolder}/${filename}`;
  },

  /**
   * Accepts base64 data URL and stores it safely after signature verification
   */
  async uploadBase64(base64String, destinationFolder = 'produce-images') {
    if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
      return base64String;
    }

    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64String;
    }

    const contentType = matches[1].toLowerCase();
    const allowedMimes = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };

    if (!allowedMimes[contentType]) {
      throw new Error('Unsupported image or document type in base64 payload.');
    }

    const ext = allowedMimes[contentType];
    const buffer = Buffer.from(matches[2], 'base64');

    // Reject payloads larger than 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('Payload exceeds maximum permitted size (10MB).');
    }

    const fakeFile = {
      buffer,
      mimetype: contentType,
      fieldname: 'image',
      originalname: `upload-${Date.now()}${ext}`,
    };

    return this.uploadFile(fakeFile, destinationFolder);
  },
};
