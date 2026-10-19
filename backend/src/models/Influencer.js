import { addPersistenceFields } from './persistence.js';
import { normalizeAvailability } from '../../../shared/availability.js';
import mongoose from 'mongoose';

const availabilityRangeSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // e.g. "09:00"
    end: { type: String, required: true }, // e.g. "12:00"
  },
  { _id: false },
);

const daySchema = new mongoose.Schema(
  { ranges: [availabilityRangeSchema] },
  { _id: false },
);
const dayAvailabilitySchema = new mongoose.Schema(
  {
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
  },
  { _id: false },
);

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Specialization Certificate' },
    fileName: { type: String },
    fileUrl: { type: String }, // Can be Vercel Blob URL or local upload URL
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const influencerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'influencer' },
    specialization: { type: String, required: true },
    category: { type: String, required: true },
    bio: { type: String, default: '' },
    hourlyRate: { type: Number, default: 150 },
    avatar: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },

    // Admin approval status
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected', 'blocked'],
      default: 'pending_review',
    },
    statusReason: { type: String, default: '' },

    // Instagram style blue badge verification
    isVerified: { type: Boolean, default: false },
    certificateStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
    },
    certification: certificationSchema,

    // Day-wise time ranges
    availability: {
      type: dayAvailabilitySchema,
      default: () =>
        normalizeAvailability({
          monday: [
            { start: '09:00', end: '12:00' },
            { start: '17:00', end: '20:00' },
          ],
          tuesday: [{ start: '10:00', end: '14:00' }],
          wednesday: [{ start: '09:00', end: '12:00' }],
          thursday: [{ start: '11:00', end: '15:00' }],
          friday: [{ start: '09:00', end: '13:00' }],
          saturday: [],
          sunday: [],
        }),
    },
  },
  { timestamps: true },
);

addPersistenceFields(influencerSchema);

export const Influencer =
  mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);
