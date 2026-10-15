import express from 'express';
import { db } from '../db.js';
import { generateDaySlots, getDayNameFromDate } from '../slotUtils.js';

const router = express.Router();

/**
 * ADMIN PLATFORM STATS & METRICS
 */
router.get('/stats', (req, res) => {
  try {
    const data = db.read();
    const totalInfluencers = data.influencers.length;
    const pendingInfluencers = data.influencers.filter(i => i.status === 'pending_review').length;
    const approvedInfluencers = data.influencers.filter(i => i.status === 'approved').length;
    const pendingCertificates = data.influencers.filter(i => i.certificateStatus === 'pending').length;
    const verifiedInfluencers = data.influencers.filter(i => i.isVerified).length;

    const totalUsers = data.users.length;
    const pendingUsers = data.users.filter(u => u.status === 'pending_review').length;

    const totalBookings = data.bookings.length;
    const confirmedBookings = data.bookings.filter(b => b.status === 'confirmed').length;
    const totalVolume = data.bookings.reduce((sum, b) => sum + (b.price || 0), 0);

    return res.json({
      totalInfluencers,
      pendingInfluencers,
      approvedInfluencers,
      pendingCertificates,
      verifiedInfluencers,
      totalUsers,
      pendingUsers,
      totalBookings,
      confirmedBookings,
      totalVolume
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

/**
 * GET ALL INFLUENCERS (With status filter: all, pending_review, approved, rejected)
 */
router.get('/influencers', (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();
    let list = data.influencers;
    if (status && status !== 'all') {
      list = list.filter(i => i.status === status);
    }
    const safeList = list.map(({ password, ...rest }) => rest);
    return res.json({ influencers: safeList });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch influencers' });
  }
});

/**
 * GET ALL USERS (With status filter)
 */
router.get('/users', (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();
    let list = data.users;
    if (status && status !== 'all') {
      list = list.filter(u => u.status === status);
    }
    const safeList = list.map(({ password, ...rest }) => rest);
    return res.json({ users: safeList });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * APPROVE OR REJECT INFLUENCER REGISTRATION
 * Prompt: "When the admin approves the influencer request only then the influencer will be active for login"
 */
router.put('/influencers/:id/status', (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['approved', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const data = db.read();
    const idx = data.influencers.findIndex(i => i.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    data.influencers[idx].status = status;
    if (reason) data.influencers[idx].statusReason = reason;

    db.write(data);

    const { password: _, ...safeInfluencer } = data.influencers[idx];
    return res.json({
      success: true,
      message: `Influencer application marked as ${status}.`,
      influencer: safeInfluencer
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update influencer status' });
  }
});

/**
 * APPROVE OR REJECT USER REGISTRATION
 */
router.put('/users/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const data = db.read();
    const idx = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    data.users[idx].status = status;
    db.write(data);

    const { password: _, ...safeUser } = data.users[idx];
    return res.json({
      success: true,
      message: `User status marked as ${status}.`,
      user: safeUser
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * VERIFY CERTIFICATE & AWARD INSTAGRAM-STYLE VERIFIED BADGE
 * Prompt: "If the influencer uploads the relevant certificate for his specialization after activation by the admin the influencer is shown with a verified batch like the instagram."
 */
router.put('/influencers/:id/verify-certificate', (req, res) => {
  try {
    const { isVerified, certificateStatus } = req.body;
    const data = db.read();
    const idx = data.influencers.findIndex(i => i.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    data.influencers[idx].isVerified = Boolean(isVerified);
    data.influencers[idx].certificateStatus = certificateStatus || (isVerified ? 'verified' : 'rejected');

    db.write(data);

    const { password: _, ...safeInfluencer } = data.influencers[idx];
    return res.json({
      success: true,
      message: isVerified 
        ? 'Influencer certificate verified! Instagram-style verified badge granted.' 
        : 'Influencer certificate verification rejected.',
      influencer: safeInfluencer
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update certificate verification' });
  }
});

/**
 * ADMIN INSPECT INFLUENCER SLOTS (AVAILABLE & BOOKED)
 * Prompt: 
 * - "Admin can see available slots for the influencer."
 * - "Admin can see the booked slots as well as available slots of the influencer."
 */
router.get('/influencers/:id/slots-overview', (req, res) => {
  try {
    const { date } = req.query; // optional date YYYY-MM-DD
    const data = db.read();
    const influencer = data.influencers.find(i => i.id === req.params.id);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklySlotPlan = {};

    for (const d of days) {
      const ranges = (influencer.availability && influencer.availability[d]) || [];
      weeklySlotPlan[d] = {
        ranges,
        generatedSlots: generateDaySlots(ranges)
      };
    }

    // If date provided, calculate specific breakdown of available vs booked slots
    let dateInspection = null;
    if (date) {
      const dayName = getDayNameFromDate(date);
      const daySlots = weeklySlotPlan[dayName]?.generatedSlots || [];
      const bookingsOnDate = data.bookings.filter(b => 
        b.influencerId === influencer.id && 
        b.date === date && 
        b.status !== 'cancelled'
      );
      const bookedSet = new Set(bookingsOnDate.map(b => b.slot));

      dateInspection = {
        date,
        dayName,
        availableSlots: daySlots.filter(s => !bookedSet.has(s.slotId)),
        bookedSlots: daySlots.filter(s => bookedSet.has(s.slotId)).map(s => {
          const bInfo = bookingsOnDate.find(b => b.slot === s.slotId);
          return {
            ...s,
            bookedBy: bInfo ? bInfo.userName : 'Unknown',
            userId: bInfo ? bInfo.userId : null,
            bookingId: bInfo ? bInfo.id : null,
            topic: bInfo ? bInfo.topic : null
          };
        })
      };
    }

    // All active bookings for this influencer
    const allBookings = data.bookings.filter(b => b.influencerId === influencer.id);

    return res.json({
      influencerId: influencer.id,
      influencerName: influencer.name,
      weeklySlotPlan,
      dateInspection,
      allBookings
    });
  } catch (err) {
    console.error('Error getting slots overview:', err);
    return res.status(500).json({ error: 'Failed to fetch slots overview' });
  }
});

/**
 * ADMIN: SEE ALL BOOKINGS
 * Prompt: "Admin can see the bookings."
 */
router.get('/bookings', (req, res) => {
  try {
    const { status, influencerId } = req.query;
    const data = db.read();
    let bookings = data.bookings;

    if (status && status !== 'all') {
      bookings = bookings.filter(b => b.status === status);
    }
    if (influencerId) {
      bookings = bookings.filter(b => b.influencerId === influencerId);
    }

    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * ADMIN: SEE CONVERSATIONS BETWEEN USERS AND INFLUENCERS
 * Prompt: "Admin can see the conversations b/w the influencer and the user."
 */
router.get('/conversations', (req, res) => {
  try {
    const data = db.read();
    const conversationsMap = new Map();

    for (const msg of data.messages) {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          userId: msg.userId,
          userName: msg.userName,
          influencerId: msg.influencerId,
          influencerName: msg.influencerName,
          lastMessage: msg.text,
          lastTimestamp: msg.timestamp,
          messageCount: 1,
          messages: [msg]
        });
      } else {
        const conv = conversationsMap.get(msg.conversationId);
        conv.messageCount += 1;
        conv.messages.push(msg);
        if (new Date(msg.timestamp) > new Date(conv.lastTimestamp)) {
          conv.lastMessage = msg.text;
          conv.lastTimestamp = msg.timestamp;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
    );

    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
