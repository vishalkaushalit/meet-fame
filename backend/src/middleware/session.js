import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export function requireSession(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please sign in.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meetfame_secret_jwt_key_2026');
    const collection = { user: 'users', influencer: 'influencers', admin: 'admins' };
    const records = Object.hasOwn(collection, decoded.role) ? db.read()[collection[decoded.role]] : [];
    const account = records.find(item => item.id === decoded.id);
    if (!account) return res.status(401).json({ error: 'Account not found.' });
    if (decoded.role !== 'admin' && account.status !== 'approved') return res.status(403).json({ error: 'Account access is restricted.' });
    req.session = { id: account.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}
