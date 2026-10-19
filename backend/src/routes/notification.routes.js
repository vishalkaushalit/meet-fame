import express from 'express';
import { db } from '../db.js';
import { requireSession } from '../middleware/session.js';
import { ensureMeetingReminders, notificationFeed } from '../notifications.js';
const router = express.Router();
router.use(requireSession);
router.get('/', (req, res) => {
  const data = db.read();
  if (ensureMeetingReminders(data) && !db.write(data))
    return res
      .status(500)
      .json({ error: 'Unable to prepare meeting reminders.' });
  res
    .set('Cache-Control', 'no-store')
    .json(notificationFeed(data, req.session));
});
router.put('/read-all', (req, res) => {
  const data = db.read();
  const visible = new Set(
    notificationFeed(data, req.session).notifications.map((item) => item.id),
  );
  for (const item of data.notifications || [])
    if (visible.has(item.id) && !item.readAt)
      item.readAt = new Date().toISOString();
  if (!db.write(data))
    return res.status(500).json({ error: 'Unable to save read status.' });
  res.json({ success: true });
});
router.put('/:id/read', (req, res) => {
  const data = db.read();
  const visible = notificationFeed(data, req.session).notifications.find(
    (item) => item.id === req.params.id,
  );
  if (!visible)
    return res.status(404).json({ error: 'Notification not found.' });
  visible.readAt ||= new Date().toISOString();
  if (!db.write(data))
    return res.status(500).json({ error: 'Unable to save read status.' });
  res.json({ success: true });
});
export default router;
