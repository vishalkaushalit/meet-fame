import mongoose from 'mongoose';
import { addPersistenceFields } from './persistence.js';
const schema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: {
    type: String,
    enum: ['all', 'user', 'influencer'],
    required: true,
  },
  sent: Number,
  activeFrom: Date,
  expiresAt: Date,
  createdAt: { type: Date, required: true },
  updatedAt: Date,
  adminId: String,
});
addPersistenceFields(schema);
export const Announcement =
  mongoose.models.Announcement || mongoose.model('Announcement', schema);
