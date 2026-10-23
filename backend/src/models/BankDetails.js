import mongoose from 'mongoose';
import { addPersistenceFields } from './persistence.js';

const schema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  ownerRole: { type: String, enum: ['admin', 'influencer'], required: true },
  encrypted: { type: mongoose.Schema.Types.Mixed, required: true },
  summary: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: String,
});
addPersistenceFields(schema);
schema.index({ ownerRole: 1, ownerId: 1 }, { unique: true });
export const BankDetails =
  mongoose.models.BankDetails || mongoose.model('BankDetails', schema);
