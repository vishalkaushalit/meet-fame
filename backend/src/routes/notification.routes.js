import express from 'express';
import { db } from '../db.js';
import { requireSession } from '../middleware/session.js';
const router = express.Router();
router.use(requireSession);
const belongsTo = (notification, session) => notification.recipientId === session.id && notification.recipientRole === session.role;
router.get('/', (req, res) => {
  const notifications = (db.read().notifications || []).filter(item => belongsTo(item, req.session)).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return res.json({ notifications, unreadCount: notifications.filter(item => !item.readAt).length });
});
router.put('/read-all', (req, res) => {
  const data = db.read();
  for (const item of data.notifications || []) if (belongsTo(item, req.session) && !item.readAt) item.readAt = new Date().toISOString();
  if (!db.write(data)) return res.status(500).json({ error: 'Unable to save notification changes.' });
  return res.json({ success: true });
});
router.put('/:id/read', (req, res) => {
  const data = db.read();
  const item = (data.notifications || []).find(item => item.id === req.params.id && belongsTo(item, req.session));
  if (!item) return res.status(404).json({ error: 'Notification not found.' });
  item.readAt ||= new Date().toISOString();
  if (!db.write(data)) return res.status(500).json({ error: 'Unable to save notification changes.' });
  return res.json({ success: true });
});
export default router;
