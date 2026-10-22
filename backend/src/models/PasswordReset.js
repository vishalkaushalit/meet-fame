import mongoose from 'mongoose';
import { addPersistenceFields } from './persistence.js';
const schema = new mongoose.Schema({
  accountId: { type: String, required: true },
  role: { type: String, enum: ['user', 'influencer', 'admin'], required: true },
  otpHash: String,
  attempts: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
});
addPersistenceFields(schema);
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', schema);
