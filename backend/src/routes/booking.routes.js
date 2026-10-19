import express from 'express';
import { notifyNewBooking, ensureMeetingReminders } from '../notifications.js';
import { requireSession } from '../middleware/session.js';
import { bookingWindow } from '../../../shared/bookingTime.js';
import { db } from '../db.js';
import { generateDaySlots, getDayNameFromDate } from '../slotUtils.js';

const router = express.Router();

/**
 * GET SLOTS FOR INFLUENCER ON A SPECIFIC DATE
 * Rule: Single slot is 1 hour.
 * Example: If influencer is available Monday 9am-12pm & 5pm-8pm,
 * auto-generate 1-hr slots: 9-10, 10-11, 11-12, 5-6, 6-7, 7-8.
 * Already booked slots are marked as isBooked: true so they can be shown disabled in dropdown.
 */
router.get('/slots', (req, res) => {
  try {
    const { influencerId, date } = req.query;
    if (!influencerId || !date) {
      return res.status(400).json({ error: 'influencerId and date (YYYY-MM-DD) are required' });
    }

    const data = db.read();
    const influencer = data.influencers.find(i => i.id === influencerId);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    const dayOfWeek = getDayNameFromDate(date);
    const dayRanges = (influencer.availability && influencer.availability[dayOfWeek]) || [];
    
    // Auto-generate 1-hour slots from day ranges
    const generatedSlots = generateDaySlots(dayRanges);

    // Find all active bookings for this influencer on this date
    const bookedOnDate = data.bookings.filter(b => 
      b.influencerId === influencerId && 
      b.date === date && 
      b.status !== 'cancelled'
    );
    const bookedSlotIds = new Set(bookedOnDate.map(b => b.slot));

    const now = Date.now();
    const slotsWithBookingStatus = generatedSlots.map(slot => {
      const window = bookingWindow({ date, slot: slot.slotId });
      const isBooked = bookedSlotIds.has(slot.slotId);
      const existingBooking = isBooked ? bookedOnDate.find(b => b.slot === slot.slotId) : null;
      return {
        slot: slot.slotId,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked,
        isPast: !window || window.start <= now,
        bookedBy: existingBooking ? existingBooking.userName : null,
        bookingId: existingBooking ? existingBooking.id : null
      };
    });

    return res.json({
      serverNow: now,
      influencerId: influencer.id,
      influencerName: influencer.name,
      date,
      dayOfWeek,
      totalSlots: slotsWithBookingStatus.length,
      availableSlotsCount: slotsWithBookingStatus.filter(s => !s.isBooked && !s.isPast).length,
      slots: slotsWithBookingStatus
    });
  } catch (err) {
    console.error('Error fetching slots:', err);
    return res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

/**
 * CREATE A BOOKING
 * User books a 1-hour slot for a specific influencer and date.
 */
router.post('/', requireSession, (req, res) => {
  try {
    const {
      influencerId,
      userId,
      date,
      slot,
      slotLabel,
      topic,
      meetingType
    } = req.body;

    if (req.session.role !== 'user' || req.session.id !== userId) return res.status(403).json({ error: 'You can only book for your own account.' });

    if (!influencerId || !userId || !date || !slot) {
      return res.status(400).json({ error: 'Missing required booking fields (influencerId, userId, date, slot)' });
    }

    const data = db.read();
    const influencer = data.influencers.find(i => i.id === influencerId);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    const user = data.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const window = bookingWindow({ date, slot });
    if (!window) return res.status(400).json({ error: 'Invalid booking date or time slot.' });
    if (window.start <= Date.now()) return res.status(409).json({ error: 'This time slot has already started. Please select a future slot (IST).' });
    const configuredSlots = generateDaySlots(influencer.availability?.[getDayNameFromDate(date)] || []);
    if (!configuredSlots.some(item => item.slotId === slot)) return res.status(400).json({ error: 'This slot is not in the influencer schedule.' });

    // Double check slot availability on this date
    const existingBooking = data.bookings.find(b => 
      b.influencerId === influencerId &&
      b.date === date &&
      b.slot === slot &&
      b.status !== 'cancelled'
    );

    if (existingBooking) {
      return res.status(409).json({ error: 'This time slot is already booked for the selected date. Please choose another available slot.' });
    }

    const dayOfWeek = getDayNameFromDate(date);
    const newBooking = {
      id: `bk_${Date.now()}`,
      influencerId: influencer.id,
      influencerName: influencer.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      date,
      dayOfWeek,
      slot,
      slotLabel: slotLabel || slot,
      topic: topic || '1-on-1 Consultation',
      meetingType: meetingType || 'video',
      status: 'confirmed',
      price: influencer.hourlyRate || 150,
      createdAt: new Date().toISOString()
    };

    data.bookings.push(newBooking);
    notifyNewBooking(data, newBooking);
    ensureMeetingReminders(data);

    // Auto-create initial message in conversation
    const conversationId = `${user.id}_${influencer.id}`;
    data.messages.push({
      id: `msg_${Date.now()}`,
      conversationId,
      userId: user.id,
      userName: user.name,
      influencerId: influencer.id,
      influencerName: influencer.name,
      senderId: user.id,
      senderRole: 'user',
      text: `Hello ${influencer.name}! I have booked a 1-hour session on ${date} (${slotLabel || slot}) regarding: "${newBooking.topic}". Looking forward to meeting!`,
      timestamp: new Date().toISOString()
    });

    if (!db.write(data)) return res.status(500).json({ error: 'Unable to save booking.' });

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: newBooking
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * GET BOOKINGS BY USER OR INFLUENCER
 */
router.get('/my-bookings', (req, res) => {
  try {
    const { userId, influencerId } = req.query;
    const data = db.read();
    let bookings = [];

    if (userId) {
      bookings = data.bookings.filter(b => b.userId === userId);
    } else if (influencerId) {
      bookings = data.bookings.filter(b => b.influencerId === influencerId);
    } else {
      return res.status(400).json({ error: 'Please provide either userId or influencerId' });
    }

    // Sort newest date first
    bookings.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * CANCEL OR UPDATE BOOKING STATUS
 */
router.put('/:id/status', requireSession, (req, res) => {
  try {
    const { status } = req.body;
    const data = db.read();
    const idx = data.bookings.findIndex(b => b.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = data.bookings[idx];
    if (req.session.role !== 'admin' && !(req.session.role === 'user' && req.session.id === booking.userId) && !(req.session.role === 'influencer' && req.session.id === booking.influencerId)) return res.status(403).json({ error: 'You cannot update this booking.' });
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid booking status.' });
    if (booking.status !== status) {
      booking.status = status;
    }
    db.write(data);

    return res.json({ success: true, booking: data.bookings[idx] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
});

export default router;
