const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ENCRYPTION_KEY wajib dikonfigurasi di file .env pada mode produksi.');
  }
  // Ensure 32 bytes
  return crypto.createHash('sha256').update(key || 'satgas-antinarkoba-dev-key-32b').digest();
}

/**
 * Enkripsi data identitas pelapor (AES-256-GCM)
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  // Format: iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Dekripsi data identitas pelapor
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Generate kode pelacakan unik (CSPRNG, ≥12 karakter)
 * Format: SATGAS-YYYY-XXXXXXXX
 */
function generateTrackingCode() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 chars
  return `SATGAS-${year}-${randomPart}`;
}

/**
 * Generate kode pelacakan eksternal
 * Format: EXT-YYYY-XXXXXXXX
 */
function generateExternalTrackingCode() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `EXT-${year}-${randomPart}`;
}

/**
 * Hash kode pelacakan untuk penyimpanan di DB
 */
function hashTrackingCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateTrackingCode,
  generateExternalTrackingCode,
  hashTrackingCode
};
