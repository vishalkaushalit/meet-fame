import express from 'express';
import { updateOwnProfile } from '../profile.js';
import { normalizeAvailability } from '../../../shared/availability.js';
import { addNotification } from '../notifications.js';
import { requireSession } from '../middleware/session.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { generateDaySlots } from '../slotUtils.js';
import { uploadToStorage } from '../blobStorage.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../data/uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Get all approved influencers (for user browsing and directory)
 */
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    const data = db.read();
    let list = data.influencers.filter((i) => {
      return i.status === 'approved';
    });

    if (category && category !== 'All') {
      list = list.filter((i) => {
        return i.category.toLowerCase() === category.toLowerCase();
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        return (
          i.name.toLowerCase().includes(q) ||
          i.specialization.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
        );
      });
    }

    const safeList = list.map(({ password, statusReason, ...rest }) => {
      return {
        ...rest,
        // Provide preview of weekly total slots
        totalWeeklySlots: Object.values(rest.availability || {}).reduce(
          (acc, ranges) => {
            return acc + generateDaySlots(ranges).length;
          },
          0,
        ),
      };
    });

    return res.json({ influencers: safeList });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch influencers',
    });
  }
});

/**
 * Get influencer profile by ID with generated slot summaries
 */
router.get('/:id', (req, res) => {
  try {
    const data = db.read();
    const influencer = data.influencers.find((i) => {
      return i.id === req.params.id;
    });
    if (!influencer) {
      return res.status(404).json({
        error: 'Influencer not found',
      });
    }

    const { password, statusReason, ...safeInfluencer } = influencer;

    // Calculate auto-generated 1-hour slots for every configured day
    const generatedSlotsByDay = {};
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    for (const d of days) {
      const ranges =
        (influencer.availability && influencer.availability[d]) || [];
      generatedSlotsByDay[d] = generateDaySlots(ranges);
    }

    return res.json({
      influencer: safeInfluencer,
      generatedSlotsByDay,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch influencer',
    });
  }
});

/**
 * Update Influencer Availability (Day-wise time ranges)
 * E.g. Monday: 9am-12pm and 5pm-8pm -> autogenerates 1-hour slots: 9-10, 10-11, 11-12, 5-6, 6-7, 7-8
 */
router.put('/:id/availability', requireSession, (req, res) => {
  try {
    if (
      req.session.role !== 'admin' &&
      !(req.session.role === 'influencer' && req.session.id === req.params.id)
    ) {
      return res.status(403).json({
        error: 'You cannot change this schedule.',
      });
    }
    const { availability } = req.body;
    if (!availability) {
      return res.status(400).json({
        error: 'Availability data is required',
      });
    }

    const data = db.read();
    const idx = data.influencers.findIndex((i) => {
      return i.id === req.params.id;
    });
    if (idx === -1) {
      return res.status(404).json({
        error: 'Influencer not found',
      });
    }

    const changed =
      JSON.stringify(data.influencers[idx].availability) !==
      JSON.stringify(normalizeAvailability(availability));
    data.influencers[idx].availability = normalizeAvailability(availability);
    if (changed) {
      const creator = data.influencers[idx];
      addNotification(
        data,
        creator.id,
        'influencer',
        'Availability updated',
        'Your weekly availability has been updated. Existing booked sessions keep their scheduled times.',
      );
      const clients = new Set(
        data.bookings.filter((booking) => {
            return (
              booking.influencerId === creator.id &&
              booking.status === 'confirmed' &&
              booking.date >= new Date().toISOString().slice(0, 10)
            );
          }).map((booking) => {
            return booking.userId;
          }),
      );
      for (const id of clients) {
        addNotification(
          data,
          id,
          'user',
          'Creator availability updated',
          `${creator.name} updated their weekly availability. Your existing booked sessions keep their scheduled times.`,
        );
      }
    }
    db.write(data);

    // Compute generated 1-hour slots for the response
    const generatedSlotsByDay = {};
    for (const day of Object.keys(availability)) {
      generatedSlotsByDay[day] = generateDaySlots(availability[day] || []);
    }

    return res.json({
      success: true,
      message: 'Day-wise availability updated successfully',
      availability: data.influencers[idx].availability,
      generatedSlotsByDay,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to update availability',
    });
  }
});

/**
 * Influencer uploads certificate for specialization
 * Rule: "If the influencer uploads the relevant certificate for his specialization after activation by the admin the influencer is shown with a verified batch like the instagram."
 */
router.post(
  '/:id/upload-certificate',
  upload.single('certificateFile'),
  async (req, res) => {
    try {
      const { title } = req.body;
      const data = db.read();
      const idx = data.influencers.findIndex((i) => {
        return i.id === req.params.id;
      });
      if (idx === -1) {
        return res.status(404).json({
          error: 'Influencer not found',
        });
      }

      let fileUrl = '/uploads/sample_cert.pdf';
      if (req.file) {
        fileUrl = await uploadToStorage(req.file, 'cert');
      }

      const certificate = {
        title: title || 'Specialization Certificate',
        fileName: req.file ? req.file.originalname : 'certificate.pdf',
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString(),
      };

      data.influencers[idx].certification = certificate;
      data.influencers[idx].certificateStatus = 'pending'; // Awaiting admin approval to grant verified badge
      db.write(data);

      return res.json({
        success: true,
        message:
          'Certificate submitted for verification. Once verified, your profile will display the Instagram-style blue verified badge!',
        certification: certificate,
        certificateStatus: 'pending',
      });
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to upload certificate',
      });
    }
  },
);

/**
 * Update Profile details
 */
router.put('/:id/profile', requireSession, (req, res) => {
  if (req.session.role !== 'influencer') {
    return res.status(403).json({
      error: 'Influencer access required.',
    });
  }
  return updateOwnProfile(req, res);
});

export default router;
