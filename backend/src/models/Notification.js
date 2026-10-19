import mongoose from 'mongoose';
import { addPersistenceFields } from './persistence.js';
const schema = new mongoose.Schema({
  key: String,
  kind: { type: String, enum: ['booking', 'reminder', 'update'] },
  recipientId: { type: String, required: true },
  recipientRole: { type: String, enum: ['user', 'influencer', 'admin'], required: true },
  bookingId: String,
  title: { type: String, required: true },
  message: { type: String, required: true },
  startsAt: Number,
  dueAt: Number,
  expiresAt: Number,
  createdAt: { type: Date, required: true },
  readAt: { type: Date, default: null }
});
addPersistenceFields(schema);
schema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });
export const Notification = mongoose.models.Notification || mongoose.model('Notification', schema);
