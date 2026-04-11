const crypto = require('crypto');

const ALGO = 'aes-256-cbc';
const SECRET = process.env.ENCRYPTION_KEY || 'ai-workflow-platform-secret-key!!'; // 32 chars
const KEY = Buffer.from(SECRET.padEnd(32).slice(0, 32));

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return '';
  // If not encrypted format (legacy plaintext), return as-is
  if (!text.includes(':')) return text;
  try {
    const [ivHex, encHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch(e) {
    return text; // fallback for legacy unencrypted keys
  }
}

module.exports = { encrypt, decrypt };
