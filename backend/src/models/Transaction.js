import mongoose from 'mongoose';
import { addPersistenceFields } from './persistence.js';

const schema = new mongoose.Schema({
  orderId: { type: String, required: true },
  paymentId: String,
  bookingId: String,
  userId: { type: String, required: true },
  userName: String,
  influencerId: { type: String, required: true },
  influencerName: String,
  date: String,
  slot: String,
  amount: { type: Number, required: true, min: 0 }, // smallest currency unit
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'paid', 'refund_pending', 'refunded'], required: true },
  refundId: String,
  usdAmount: { type: Number, min: 0 }, // cents; reporting value for historical payments
  usdAmountSource: { type: String, enum: ['payment', 'booking_price'] },
}, { timestamps: true });
addPersistenceFields(schema);
schema.index({ orderId: 1 }, { unique: true });
schema.index({ userId: 1, createdAt: -1 });
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', schema);
