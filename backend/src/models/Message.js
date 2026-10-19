import mongoose from 'mongoose';
import { addPersistenceFields } from './persistence.js';
const schema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  userId: String,
  userName: String,
  influencerId: String,
  influencerName: String,
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['user', 'influencer', 'admin'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true }
});
addPersistenceFields(schema);
export const Message = mongoose.models.Message || mongoose.model('Message', schema);
