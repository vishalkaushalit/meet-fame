import { addPersistenceFields } from './persistence.js';
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  influencerId: { type: String, required: true },
  influencerName: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userPhone: { type: String, default: '' },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  dayOfWeek: { type: String, required: true }, // "monday"
  slot: { type: String, required: true }, // "09:00 - 10:00"
  slotLabel: { type: String, required: true }, // "9:00 AM - 10:00 AM"
  topic: { type: String, default: 'General Consultation & Mentorship' },
  meetingType: { type: String, enum: ['video', 'in-person'], default: 'video' },
  status: { type: String, enum: ['confirmed', 'completed', 'cancelled'], default: 'confirmed' },
  _activeSlot: String,
  price: { type: Number, default: 150 }
}, { timestamps: true });

addPersistenceFields(bookingSchema);
bookingSchema.index({ _activeSlot: 1 }, { unique: true, partialFilterExpression: { _activeSlot: { $type: 'string' } } });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
