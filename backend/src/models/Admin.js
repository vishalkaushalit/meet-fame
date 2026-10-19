import { addPersistenceFields } from './persistence.js';
import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

addPersistenceFields(adminSchema);

export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
