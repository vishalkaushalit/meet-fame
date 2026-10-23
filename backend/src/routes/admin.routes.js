import { randomUUID } from 'node:crypto';
import { phoneError, normalizePhone } from '../../../shared/phoneValidation.js';
import express from 'express';
import { dayRanges } from '../../../shared/availability.js';
import { addNotification } from '../notifications.js';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { identityErrors } from '../accountIdentity.js';
import { generateDaySlots, getDayNameFromDate } from '../slotUtils.js';

const router = express.Router();

// Administrative actions require a current administrator account.
router.use((req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'meetfame_secret_jwt_key_2026',
    );
    if (
      decoded.role !== 'admin' ||
      !db.read().admins.some((admin) => {
        return (
          admin.id === decoded.id &&
          (admin.sessionVersion || 0) === (decoded.sessionVersion || 0)
        );
      })
    ) {
      return res.status(403).json({
        error: 'Administrator access required',
      });
    }
    req.adminId = decoded.id;
    return next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
});

router.put('/profile', (req, res) => {
  const { name, email, phone } = req.body;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 100 ||
    typeof email !== 'string' ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof phone !== 'string' ||
    phone.trim().length > 40
  ) {
    return res.status(400).json({
      error:
        'Enter a valid name, email and phone number (up to 40 characters).',
    });
  }
  const phoneIssue = phoneError(phone);
  if (phoneIssue) {
    return res.status(400).json({
      error: phoneIssue,
    });
  }
  const data = db.read();
  const account = data.admins.find((item) => {
    return item.id === req.adminId;
  });
  if (!account) {
    return res.status(404).json({
      error: 'Administrator account not found.',
    });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const duplicates = identityErrors(
    data,
    { email: normalizedEmail, phone },
    { collection: 'admins', id: account.id },
  );
  if (Object.keys(duplicates).length) {
    return res.status(409).json({
      error: Object.values(duplicates)[0],
      fields: duplicates,
    });
  }
  account.name = name.trim();
  account.email = normalizedEmail;
  account.phone = normalizePhone(phone);
  account.updatedAt = new Date().toISOString();
  if (!db.write(data)) {
    return res.status(500).json({
      error: 'Unable to save profile. Please try again.',
    });
  }
  const { password, ...user } = account;
  return res.json({ success: true, user });
});

/**
 * ADMIN PLATFORM STATS & METRICS
 */
const announcementDates = (body) => {
  if (!body.activeFrom) {
    return null;
  }
  const activeFrom = Date.parse(body.activeFrom);
  const expiresAt = body.expiresAt ? Date.parse(body.expiresAt) : null;
  if (
    !Number.isFinite(activeFrom) ||
    (expiresAt !== null &&
      (!Number.isFinite(expiresAt) || expiresAt <= activeFrom))
  ) {
    return null;
  }
  return {
    activeFrom: new Date(activeFrom).toISOString(),
    expiresAt: expiresAt === null ? null : new Date(expiresAt).toISOString(),
  };
};
router.get('/announcements', (req, res) => {
  const announcements = [...(db.read().announcements || [])].sort((a, b) => {
    return b.createdAt.localeCompare(a.createdAt);
  });
  res.json({ announcements });
});
router.get('/announcements/:id', (req, res) => {
  const announcement = (db.read().announcements || []).find((item) => {
    return item.id === req.params.id;
  });
  if (!announcement) {
    return res.status(404).json({
      error: 'Announcement not found.',
    });
  }
  res.json({ announcement });
});
router.put('/announcements/:id', (req, res) => {
  const dates = announcementDates(req.body);
  if (!dates) {
    return res.status(400).json({
      error:
        'Choose an activation date. If provided, expiry must be after activation.',
    });
  }
  const { title, message } = req.body;
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 100 ||
    typeof message !== 'string' ||
    !message.trim() ||
    message.trim().length > 2000
  ) {
    return res.status(400).json({
      error: 'Provide a valid title and message.',
    });
  }
  const data = db.read();
  const announcement = (data.announcements || []).find((item) => {
    return item.id === req.params.id;
  });
  if (!announcement) {
    return res.status(404).json({
      error: 'Announcement not found.',
    });
  }
  Object.assign(announcement, {
    ...dates,
    title: title.trim(),
    message: message.trim(),
    updatedAt: new Date().toISOString(),
  });
  for (const notification of data.notifications || []) {
    if (notification.announcementId === announcement.id) {
      Object.assign(notification, {
        title: announcement.title,
        message: announcement.message,
        dueAt: Date.parse(dates.activeFrom),
        expiresAt: dates.expiresAt ? Date.parse(dates.expiresAt) : null,
      });
    }
  }
  if (!db.write(data)) {
    return res.status(500).json({
      error: 'Unable to update announcement.',
    });
  }
  res.json({ announcement });
});
router.delete('/announcements/:id', (req, res) => {
  const data = db.read();
  if (
    !(data.announcements || []).some((item) => {
      return item.id === req.params.id;
    })
  ) {
    return res.status(404).json({
      error: 'Announcement not found.',
    });
  }
  data.announcements = data.announcements.filter((item) => {
    return item.id !== req.params.id;
  });
  data.notifications = (data.notifications || []).filter((item) => {
    return item.announcementId !== req.params.id;
  });
  if (!db.write(data)) {
    return res.status(500).json({
      error: 'Unable to delete announcement.',
    });
  }
  res.json({ success: true });
});

router.post('/announcements', (req, res) => {
  const dates = announcementDates(req.body);
  if (!dates) {
    return res.status(400).json({
      error:
        'Choose an activation date. If provided, expiry must be after activation.',
    });
  }
  const { title, message, audience } = req.body;
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 100 ||
    typeof message !== 'string' ||
    !message.trim() ||
    message.trim().length > 2000 ||
    !['all', 'user', 'influencer'].includes(audience)
  ) {
    return res.status(400).json({
      error: 'Provide a title, message and valid audience.',
    });
  }
  const data = db.read();
  const announcementId = randomUUID();
  let sent = 0;
  for (const [role, accounts] of [
    ['user', data.users],
    ['influencer', data.influencers],
  ]) {
    if (audience !== 'all' && audience !== role) {
      continue;
    }
    for (const account of accounts.filter((item) => {
      return item.status === 'approved';
    })) {
      const notification = addNotification(
        data,
        account.id,
        role,
        title.trim(),
        message.trim(),
      );
      notification.announcementId = announcementId;
      notification.dueAt = Date.parse(dates.activeFrom);
      notification.expiresAt = dates.expiresAt
        ? Date.parse(dates.expiresAt)
        : null;
      sent++;
    }
  }
  data.announcements ||= [];
  data.announcements.push({
    ...dates,
    id: announcementId,
    title: title.trim(),
    message: message.trim(),
    audience,
    sent,
    adminId: req.adminId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (!db.write(data)) {
    return res.status(500).json({
      error: 'Unable to save announcement.',
    });
  }
  return res.status(201).json({
    success: true,
    sent,
  });
});

router.get('/stats', (req, res) => {
  try {
    const data = db.read();
    const totalInfluencers = data.influencers.length;
    const pendingInfluencers = data.influencers.filter((i) => {
      return i.status === 'pending_review';
    }).length;
    const approvedInfluencers = data.influencers.filter((i) => {
      return i.status === 'approved';
    }).length;
    const pendingCertificates = data.influencers.filter((i) => {
      return i.certificateStatus === 'pending';
    }).length;
    const verifiedInfluencers = data.influencers.filter((i) => {
      return i.isVerified;
    }).length;

    const totalUsers = data.users.length;
    const pendingUsers = data.users.filter((u) => {
      return u.status === 'pending_review';
    }).length;

    const totalBookings = data.bookings.length;
    const confirmedBookings = data.bookings.filter((b) => {
      return b.status === 'confirmed';
    }).length;
    const totalVolume = data.bookings.reduce((sum, b) => {
      return sum + (b.price || 0);
    }, 0);

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
      totalVolume,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch admin stats',
    });
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
      list = list.filter((i) => {
        return i.status === status;
      });
    }
    const safeList = list.map(({ password, ...rest }) => {
      return rest;
    });
    return res.json({ influencers: safeList });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch influencers',
    });
  }
});

/**
 * GET ALL USERS (With status filter)
 */
// Unified directory is protected by the administrator middleware above.
router.get('/accounts', (req, res) => {
  try {
    const data = db.read();
    const accounts = [
      ['user', data.users],
      ['influencer', data.influencers],
      ['admin', data.admins],
    ].flatMap(([role, records]) => {
      return records.map((account) => {
        return {
          id: account.id,
          name: account.name,
          email: account.email,
          phone: account.phone,
          createdAt: account.createdAt,
          role,
          status: role === 'admin' ? 'active' : account.status,
          statusReason: role === 'admin' ? '' : account.statusReason || '',
        };
      });
    });
    return res.json({ accounts });
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch account directory',
    });
  }
});

router.get('/accounts/:role/:id', (req, res) => {
  try {
    const collections = {
      user: 'users',
      influencer: 'influencers',
      admin: 'admins',
    };
    const collection = Object.hasOwn(collections, req.params.role)
      ? collections[req.params.role]
      : null;
    if (!collection) {
      return res.status(400).json({
        error: 'Invalid account role',
      });
    }
    const account = db.read()[collection].find((item) => {
      return item.id === req.params.id;
    });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
      });
    }
    const { password, ...safeAccount } = account;
    return res.json({
      account: {
        ...safeAccount,
        role: req.params.role,
        status: req.params.role === 'admin' ? 'active' : account.status,
      },
    });
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch account details',
    });
  }
});

router.get('/users', (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();
    let list = data.users;
    if (status && status !== 'all') {
      list = list.filter((u) => {
        return u.status === status;
      });
    }
    const safeList = list.map(({ password, ...rest }) => {
      return rest;
    });
    return res.json({ users: safeList });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch users',
    });
  }
});

/**
 * APPROVE OR REJECT INFLUENCER REGISTRATION
 * Prompt: "When the admin approves the influencer request only then the influencer will be active for login"
 */
router.put('/influencers/:id/status', (req, res) => {
  try {
    const { status, reason } = req.body;
    if (
      !['approved', 'rejected', 'pending_review', 'blocked'].includes(status)
    ) {
      return res.status(400).json({
        error: 'Invalid status',
      });
    }

    if (
      status === 'blocked' &&
      (typeof reason !== 'string' ||
        !reason.trim() ||
        reason.trim().length > 1000)
    ) {
      return res.status(400).json({
        error: 'A blocking remark between 1 and 1000 characters is required.',
      });
    }

    const data = db.read();
    const idx = data.influencers.findIndex((i) => {
      return i.id === req.params.id;
    });
    if (idx === -1) {
      return res.status(404).json({
        error: 'Influencer not found',
      });
    }

    data.influencers[idx].status = status;
    data.influencers[idx].statusReason =
      status === 'approved'
        ? ''
        : typeof reason === 'string'
          ? reason.trim()
          : '';

    db.write(data);

    const { password: _, ...safeInfluencer } = data.influencers[idx];
    return res.json({
      success: true,
      message: `Influencer application marked as ${status}.`,
      influencer: safeInfluencer,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to update influencer status',
    });
  }
});

/**
 * BLOCK OR UNBLOCK USER ACCOUNTS (registration is automatic)
 */
router.put('/users/:id/status', (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['approved', 'blocked'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
      });
    }
    if (
      status === 'blocked' &&
      (typeof reason !== 'string' ||
        !reason.trim() ||
        reason.trim().length > 1000)
    ) {
      return res.status(400).json({
        error: 'A blocking remark between 1 and 1000 characters is required.',
      });
    }

    const data = db.read();
    const idx = data.users.findIndex((u) => {
      return u.id === req.params.id;
    });
    if (idx === -1) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    data.users[idx].status = status;
    data.users[idx].statusReason =
      status === 'approved'
        ? ''
        : typeof reason === 'string'
          ? reason.trim()
          : '';
    db.write(data);

    const { password: _, ...safeUser } = data.users[idx];
    return res.json({
      success: true,
      message: `User status marked as ${status}.`,
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to update user status',
    });
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
    const idx = data.influencers.findIndex((i) => {
      return i.id === req.params.id;
    });
    if (idx === -1) {
      return res.status(404).json({
        error: 'Influencer not found',
      });
    }

    data.influencers[idx].isVerified = Boolean(isVerified);
    data.influencers[idx].certificateStatus =
      certificateStatus || (isVerified ? 'verified' : 'rejected');

    db.write(data);

    const { password: _, ...safeInfluencer } = data.influencers[idx];
    return res.json({
      success: true,
      message: isVerified
        ? 'Influencer certificate verified! Instagram-style verified badge granted.'
        : 'Influencer certificate verification rejected.',
      influencer: safeInfluencer,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to update certificate verification',
    });
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
    const influencer = data.influencers.find((i) => {
      return i.id === req.params.id;
    });
    if (!influencer) {
      return res.status(404).json({
        error: 'Influencer not found',
      });
    }

    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const weeklySlotPlan = {};

    for (const d of days) {
      const ranges = dayRanges(influencer.availability?.[d]);
      weeklySlotPlan[d] = {
        ranges,
        generatedSlots: generateDaySlots(ranges),
      };
    }

    // If date provided, calculate specific breakdown of available vs booked slots
    let dateInspection = null;
    if (date) {
      const dayName = getDayNameFromDate(date);
      const daySlots = weeklySlotPlan[dayName]?.generatedSlots || [];
      const bookingsOnDate = data.bookings.filter((b) => {
        return (
          b.influencerId === influencer.id &&
          b.date === date &&
          b.status !== 'cancelled'
        );
      });
      const bookedSet = new Set(
        bookingsOnDate.map((b) => {
          return b.slot;
        }),
      );

      dateInspection = {
        date,
        dayName,
        availableSlots: daySlots.filter((s) => {
          return !bookedSet.has(s.slotId);
        }),
        bookedSlots: daySlots.filter((s) => {
            return bookedSet.has(s.slotId);
          }).map((s) => {
            const bInfo = bookingsOnDate.find((b) => {
              return b.slot === s.slotId;
            });
            return {
              ...s,
              bookedBy: bInfo ? bInfo.userName : 'Unknown',
              userId: bInfo ? bInfo.userId : null,
              bookingId: bInfo ? bInfo.id : null,
              topic: bInfo ? bInfo.topic : null,
            };
          }),
      };
    }

    // All active bookings for this influencer
    const allBookings = data.bookings.filter((b) => {
      return b.influencerId === influencer.id;
    });

    return res.json({
      influencerId: influencer.id,
      influencerName: influencer.name,
      weeklySlotPlan,
      dateInspection,
      allBookings,
    });
  } catch (err) {
    console.error('Error getting slots overview:', err);
    return res.status(500).json({
      error: 'Failed to fetch slots overview',
    });
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
      bookings = bookings.filter((b) => {
        return b.status === status;
      });
    }
    if (influencerId) {
      bookings = bookings.filter((b) => {
        return b.influencerId === influencerId;
      });
    }

    bookings.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch bookings',
    });
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
          messages: [msg],
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

    const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
      return new Date(b.lastTimestamp) - new Date(a.lastTimestamp);
    });

    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch conversations',
    });
  }
});

export default router;
