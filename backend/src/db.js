import fs from 'fs';
import { databaseContext } from './databaseContext.js';
import { normalizeAvailability } from '../../shared/availability.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/db.json');

// Initial seed data generator
function getInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);

  return {
    admins: [
      {
        id: 'adm_1',
        name: 'Sarah Connor (Super Admin)',
        email: 'admin@meetfame.com',
        password: adminPasswordHash,
        phone: '+1 555-0199',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ],
    users: [
      {
        id: 'usr_1',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: defaultPasswordHash,
        phone: '+1 555-0142',
        role: 'user',
        status: 'approved',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_2',
        name: 'David Chen',
        email: 'david@example.com',
        password: defaultPasswordHash,
        phone: '+1 555-0188',
        role: 'user',
        status: 'approved',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_3',
        name: 'Elena Rostova',
        email: 'elena@example.com',
        password: defaultPasswordHash,
        phone: '+1 555-0177',
        role: 'user',
        status: 'pending_review',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        createdAt: new Date().toISOString(),
      },
    ],
    influencers: [
      {
        id: 'inf_1',
        name: 'Marcus Vance',
        email: 'marcus@techcreator.io',
        password: defaultPasswordHash,
        phone: '+1 555-0201',
        role: 'influencer',
        specialization: 'AI Product Strategy & Venture Capital',
        category: 'Technology & AI',
        bio: 'Ex-Google AI lead, Forbes 30u30, angel investor in 40+ AI startups. Helping founders scale & ship transformative products.',
        hourlyRate: 250,
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        status: 'approved', // 'pending_review', 'approved', 'rejected'
        isVerified: true, // Instagram style verified badge
        certificateStatus: 'verified', // 'none', 'pending', 'verified', 'rejected'
        certification: {
          title: 'Stanford Executive AI & Venture Architecture',
          fileName: 'stanford_ai_fellowship.pdf',
          fileUrl: '/uploads/sample_cert.pdf',
          uploadedAt: '2026-10-10T12:00:00Z',
        },
        availability: {
          monday: [
            { start: '09:00', end: '12:00' },
            { start: '17:00', end: '20:00' },
          ],
          tuesday: [{ start: '10:00', end: '14:00' }],
          wednesday: [
            { start: '09:00', end: '12:00' },
            { start: '16:00', end: '19:00' },
          ],
          thursday: [{ start: '11:00', end: '15:00' }],
          friday: [{ start: '09:00', end: '13:00' }],
          saturday: [{ start: '10:00', end: '12:00' }],
          sunday: [],
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'inf_2',
        name: 'Dr. Sophia Reyes',
        email: 'sophia@wellnesslab.com',
        password: defaultPasswordHash,
        phone: '+1 555-0202',
        role: 'influencer',
        specialization: 'Biohacking, Longevity & Clinical Nutrition',
        category: 'Health & Fitness',
        bio: 'MD & Neuro-nutritionist. Featured on Huberman Lab & Rogan. I design science-backed protocols for peak human performance.',
        hourlyRate: 300,
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        status: 'approved',
        isVerified: true,
        certificateStatus: 'verified',
        certification: {
          title: 'Harvard Medical Longevity & Metabolic Medicine Board',
          fileName: 'harvard_med_board.pdf',
          fileUrl: '/uploads/sample_cert.pdf',
          uploadedAt: '2026-10-11T14:30:00Z',
        },
        availability: {
          monday: [
            { start: '08:00', end: '11:00' },
            { start: '14:00', end: '17:00' },
          ],
          tuesday: [{ start: '09:00', end: '13:00' }],
          wednesday: [{ start: '10:00', end: '15:00' }],
          thursday: [{ start: '08:00', end: '12:00' }],
          friday: [{ start: '13:00', end: '16:00' }],
          saturday: [],
          sunday: [],
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'inf_3',
        name: 'Jordan Sterling',
        email: 'jordan@voguemedia.co',
        password: defaultPasswordHash,
        phone: '+1 555-0203',
        role: 'influencer',
        specialization: 'Luxury Brand Direction & Viral Aesthetics',
        category: 'Fashion & Lifestyle',
        bio: 'Creative director for top luxury fashion houses in Paris & Milan. 2.4M followers. Mentoring next-gen creators on brand partnerships.',
        hourlyRate: 200,
        avatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        status: 'approved',
        isVerified: false,
        certificateStatus: 'pending', // Pending admin certificate review
        certification: {
          title: 'Parsons School of Design Master Accreditation',
          fileName: 'parsons_master_cert.pdf',
          fileUrl: '/uploads/sample_cert.pdf',
          uploadedAt: '2026-10-14T09:15:00Z',
        },
        availability: {
          monday: [
            { start: '10:00', end: '13:00' },
            { start: '15:00', end: '18:00' },
          ],
          tuesday: [{ start: '11:00', end: '16:00' }],
          wednesday: [{ start: '13:00', end: '17:00' }],
          thursday: [{ start: '10:00', end: '14:00' }],
          friday: [{ start: '10:00', end: '14:00' }],
          saturday: [{ start: '12:00', end: '15:00' }],
          sunday: [],
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'inf_4',
        name: 'Kavita Patel',
        email: 'kavita@angelvc.in',
        password: defaultPasswordHash,
        phone: '+1 555-0204',
        role: 'influencer',
        specialization: 'Fintech, SaaS Monetization & Early Growth',
        category: 'Business & Finance',
        bio: 'Built & exited 2 SaaS ventures ($60M ARR). Investing in pre-seed software businesses across North America & APAC.',
        hourlyRate: 350,
        avatar:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        status: 'pending_review', // Pending review for demoing approval workflow!
        isVerified: false,
        certificateStatus: 'pending',
        certification: {
          title: 'Wharton FinTech Fellow Certification',
          fileName: 'wharton_fintech_cert.pdf',
          fileUrl: '/uploads/sample_cert.pdf',
          uploadedAt: '2026-10-15T08:00:00Z',
        },
        availability: {
          monday: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '17:00' },
          ],
          tuesday: [{ start: '09:00', end: '12:00' }],
          wednesday: [{ start: '14:00', end: '18:00' }],
          thursday: [{ start: '09:00', end: '13:00' }],
          friday: [{ start: '10:00', end: '15:00' }],
          saturday: [],
          sunday: [],
        },
        createdAt: new Date().toISOString(),
      },
    ],
    bookings: [
      {
        id: 'bk_1',
        influencerId: 'inf_1',
        influencerName: 'Marcus Vance',
        userId: 'usr_1',
        userName: 'Alex Rivera',
        userEmail: 'alex@example.com',
        userPhone: '+1 555-0142',
        date: '2026-10-19', // Monday
        dayOfWeek: 'monday',
        slot: '09:00 - 10:00',
        slotLabel: '9:00 AM - 10:00 AM',
        topic: 'AI Agent Architecture & GTM Strategy for enterprise SaaS',
        meetingType: 'video',
        status: 'confirmed',
        price: 250,
        createdAt: '2026-10-14T10:00:00Z',
      },
      {
        id: 'bk_2',
        influencerId: 'inf_1',
        influencerName: 'Marcus Vance',
        userId: 'usr_2',
        userName: 'David Chen',
        userEmail: 'david@example.com',
        userPhone: '+1 555-0188',
        date: '2026-10-19', // Monday
        dayOfWeek: 'monday',
        slot: '17:00 - 18:00',
        slotLabel: '5:00 PM - 6:00 PM',
        topic: 'Fundraising pitch deck review for Seed round',
        meetingType: 'video',
        status: 'confirmed',
        price: 250,
        createdAt: '2026-10-14T15:20:00Z',
      },
      {
        id: 'bk_3',
        influencerId: 'inf_2',
        influencerName: 'Dr. Sophia Reyes',
        userId: 'usr_1',
        userName: 'Alex Rivera',
        userEmail: 'alex@example.com',
        userPhone: '+1 555-0142',
        date: '2026-10-20', // Tuesday
        dayOfWeek: 'tuesday',
        slot: '10:00 - 11:00',
        slotLabel: '10:00 AM - 11:00 AM',
        topic: 'Personalized biomarker optimization & sleep protocol',
        meetingType: 'video',
        status: 'confirmed',
        price: 300,
        createdAt: '2026-10-15T09:00:00Z',
      },
    ],
    messages: [
      {
        id: 'msg_1',
        conversationId: 'usr_1_inf_1',
        userId: 'usr_1',
        userName: 'Alex Rivera',
        influencerId: 'inf_1',
        influencerName: 'Marcus Vance',
        senderId: 'usr_1',
        senderRole: 'user',
        text: 'Hi Marcus! Excited for our upcoming Monday slot at 9 AM. I have sent over our pitch deck and system architecture.',
        timestamp: '2026-10-14T10:15:00Z',
      },
      {
        id: 'msg_2',
        conversationId: 'usr_1_inf_1',
        userId: 'usr_1',
        userName: 'Alex Rivera',
        influencerId: 'inf_1',
        influencerName: 'Marcus Vance',
        senderId: 'inf_1',
        senderRole: 'influencer',
        text: 'Hey Alex! Got the deck. Looking forward to breaking down your multi-agent architecture and distribution flywheels. See you Monday!',
        timestamp: '2026-10-14T10:45:00Z',
      },
      {
        id: 'msg_3',
        conversationId: 'usr_2_inf_1',
        userId: 'usr_2',
        userName: 'David Chen',
        influencerId: 'inf_1',
        influencerName: 'Marcus Vance',
        senderId: 'usr_2',
        senderRole: 'user',
        text: 'Hello Marcus, would it be possible to focus specifically on SAFE valuation caps during our 5 PM call?',
        timestamp: '2026-10-15T08:30:00Z',
      },
      {
        id: 'msg_4',
        conversationId: 'usr_2_inf_1',
        userId: 'usr_2',
        userName: 'David Chen',
        influencerId: 'inf_1',
        influencerName: 'Marcus Vance',
        senderId: 'inf_1',
        senderRole: 'influencer',
        text: 'Absolutely David. Have your cap table models open and we will run sensitivity scenarios live.',
        timestamp: '2026-10-15T09:05:00Z',
      },
    ],
  };
}

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      this.write(initial);
      console.log(' MeetFame Database initialized with seed data at:', DB_FILE);
    }
  }

  read() {
    const context = databaseContext.getStore();
    if (context) {
      return structuredClone(context.state);
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      for (const creator of parsed.influencers || []) {
        creator.availability = normalizeAvailability(creator.availability);
      }
      return parsed;
    } catch (err) {
      console.error(
        'Error reading database file, resetting to initial seed:',
        err,
      );
      const initial = getInitialData();
      this.write(initial);
      return initial;
    }
  }

  write(data) {
    const context = databaseContext.getStore();
    if (context) {
      for (const creator of data.influencers || []) {
        creator.availability = normalizeAvailability(creator.availability);
      }
      context.state = structuredClone(data);
      context.dirty = true;
      return true;
    }
    try {
      for (const creator of data.influencers || []) {
        creator.availability = normalizeAvailability(creator.availability);
      }
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
      return true;
    } catch (err) {
      console.error('Error writing to database:', err);
      return false;
    }
  }
}

export const db = new Database();
