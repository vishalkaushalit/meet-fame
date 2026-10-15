import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * GET MESSAGES FOR A CONVERSATION
 */
router.get('/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const data = db.read();
    const messages = data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * SEND MESSAGE BETWEEN USER AND INFLUENCER
 */
router.post('/send', (req, res) => {
  try {
    const {
      conversationId,
      userId,
      userName,
      influencerId,
      influencerName,
      senderId,
      senderRole,
      text
    } = req.body;

    if (!senderId || !text) {
      return res.status(400).json({ error: 'Sender and text are required' });
    }

    const convId = conversationId || `${userId}_${influencerId}`;
    const data = db.read();

    const newMsg = {
      id: `msg_${Date.now()}`,
      conversationId: convId,
      userId,
      userName: userName || 'User',
      influencerId,
      influencerName: influencerName || 'Influencer',
      senderId,
      senderRole: senderRole || 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    data.messages.push(newMsg);
    db.write(data);

    return res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
