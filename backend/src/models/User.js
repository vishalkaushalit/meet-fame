import { addPersistenceFields } from './persistence.js';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
  statusReason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'blocked'],
    default: 'approved'
  }
}, { timestamps: true });

addPersistenceFields(userSchema);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
