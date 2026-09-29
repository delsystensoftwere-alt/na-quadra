import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// A Vercel vai usar a env JWT_SECRET, se não existir, usa uma string de dev
const JWT_SECRET = process.env.JWT_SECRET || 'na-quadra-dev-secret-key-12345';
// We use a global salt to avoid rainbow tables, since we can't store per-user salts in Apps Script without modifying it.
const GLOBAL_SALT = process.env.GLOBAL_SALT || 'na-quadra-global-salt';

export const Auth = {
  async hashPassword(plainTextPassword) {
    return crypto.createHash('sha256').update(plainTextPassword + GLOBAL_SALT).digest('hex');
  },

  async comparePassword(plainTextPassword, hashedPassword) {
    const hash = await this.hashPassword(plainTextPassword);
    return hash === hashedPassword;
  },

  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
};
