import { normalizePhone } from '../../../shared/phoneValidation.js';
import { handleUpload } from '@vercel/blob/client';
import { parseBuffer } from 'music-metadata';
import {
  registrationErrors,
  certificateError,
  introVideoError,
} from '../../../shared/registrationValidation.js';
import express from 'express';
import { getBankDetails, saveBankDetails } from '../bankDetails.js';
import { requireSession } from '../middleware/session.js';
import { updateOwnProfile } from '../profile.js';
import { receiveProfileImage } from '../profileUpload.js';
import { identityErrors } from '../accountIdentity.js';
import { forgotPassword, verifyOtp, resetPassword, recoveryRateLimit } from '../passwordRecovery.js';
import { normalizeAvailability } from '../../../shared/availability.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { db } from '../db.js';
import { uploadToStorage } from '../blobStorage.js';

const router = express.Router();
router.get('/bank-details', requireSession, getBankDetails);
router.put('/bank-details', requireSession, saveBankDetails);
router.put('/profile', requireSession, receiveProfileImage, handleProfileUpdate);
async function handleProfileUpdate(req, res) {
  try { await updateOwnProfile(req, res); }
  catch { res.status(503).json({ error: 'Unable to save your profile. Please try again.' }); }
}
const recoveryHandler = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch { res.status(503).json({ error: 'Password recovery is temporarily unavailable. Please try again later.' }); }
};
router.post('/forgot-password', recoveryRateLimit, recoveryHandler(forgotPassword));
router.post('/verify-reset-otp', recoveryRateLimit, recoveryHandler(verifyOtp));
router.post('/reset-password', recoveryRateLimit, recoveryHandler(resetPassword));
// Read at request time: server environment configuration loads after route imports.
const getJwtSecret = () =>
  process.env.JWT_SECRET || 'meetfame_secret_jwt_key_2026';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 2, fields: 15 },
  fileFilter: (_req, file, cb) => {
    const issue = file.fieldname === 'introVideoFile'
      ? introVideoError({ ...file, size: 1 })
      : certificateError({ ...file, size: 0 });
    cb(issue ? Object.assign(new Error(issue), { field: file.fieldname }) : null, !issue);
  },
});

// Helper to sign JWT
function generateToken(payload) {
  const collection = { user: 'users', influencer: 'influencers', admin: 'admins' }[payload.role];
  const account = collection && db.read()[collection]?.find((item) => item.id === payload.id);
  return jwt.sign({ ...payload, sessionVersion: account?.sessionVersion || 0 }, getJwtSecret(), { expiresIn: '7d' });
}

// Videos upload directly to Blob to avoid the serverless request body limit.
router.post('/intro-video-upload', async (req, res) => {
  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('introduction_video/intro-')) throw new Error('Invalid video path.');
        return { allowedContentTypes: ['video/mp4', 'video/webm'], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    res.json(result);
  } catch {
    res.status(400).json({ error: 'Unable to upload introduction video.' });
  }
});

async function readIntroVideo(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname) || !parsed.pathname.startsWith('/introduction_video/intro-'))
    throw new Error('Invalid introduction video URL.');
  const response = await fetch(parsed, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Video unavailable.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024) throw new Error('Video exceeds 5 MB.');
    chunks.push(chunk);
  }
  return { buffer: Buffer.concat(chunks), size, mimetype: response.headers.get('content-type')?.split(';')[0], originalname: parsed.pathname };
}

/**
 * INFLUENCER REGISTRATION
 * Enter name, email, phone number, specialization, certification, category, availability
 */
router.post(
  '/register-influencer',
  (req, res, next) =>
    upload.fields([{ name: 'certificateFile', maxCount: 1 }, { name: 'introVideoFile', maxCount: 1 }])(req, res, (error) => {
      if (!error) return next();
      const issue = error.code === 'LIMIT_FILE_SIZE'
        ? 'Each upload must be 10 MB or smaller (video maximum: 5 MB).'
        : error.message || 'Invalid upload.';
      const field = error.field || 'introVideoFile';
      return res.status(400).json({ error: issue, fields: { [field]: issue } });
    }),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        specialization,
        category,
        bio,
        hourlyRate,
        certificateTitle,
        availability,
      } = req.body;

      const certificateFile = req.files?.certificateFile?.[0];
      let introVideoFile = req.files?.introVideoFile?.[0];
      try {
        if (req.body.introVideoUrl) introVideoFile = await readIntroVideo(req.body.introVideoUrl);
        if (introVideoFile && !introVideoError(introVideoFile)) {
          const metadata = await parseBuffer(introVideoFile.buffer, { mimeType: introVideoFile.mimetype }, { duration: true });
          const duration = Math.max(
            metadata.format.containerDuration || 0,
            metadata.format.duration || 0,
            ...(metadata.format.trackInfo || []).map((track) => track.duration || 0),
          );
          if (!metadata.format.hasVideo || !Number.isFinite(duration) || duration <= 0 || duration > 15)
            throw new Error('Introduction video must be 15 seconds or shorter.');
        }
      } catch {
        const issue = 'Upload a valid video, up to 5 MB and 15 seconds long.';
        return res.status(400).json({ error: issue, fields: { introVideoFile: issue } });
      }
      const fields = registrationErrors(
        { ...req.body, certificateFile, introVideoFile },
        'influencer',
      );
      if (Object.keys(fields).length)
        return res
          .status(400)
          .json({ error: Object.values(fields)[0], fields });

      const data = db.read();
      const duplicates = identityErrors(data, { email, phone });
      if (Object.keys(duplicates).length) return res.status(409).json({ error: Object.values(duplicates)[0], fields: duplicates });

      let parsedAvailability = {};
      try {
        parsedAvailability =
          typeof availability === 'string'
            ? JSON.parse(availability)
            : availability || {};
      } catch {
        parsedAvailability = {};
      }

      let fileUrl = '/uploads/sample_cert.pdf';
      if (certificateFile) {
        fileUrl = await uploadToStorage(certificateFile, 'cert');
      }

      const introVideoUrl = req.body.introVideoUrl || await uploadToStorage(introVideoFile, 'intro');

      const certData = {
        title: certificateTitle || 'Specialization Certificate',
        fileName: certificateFile
          ? certificateFile.originalname
          : certificateTitle
            ? 'certificate_declared.pdf'
            : null,
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString(),
      };

      const salt = bcrypt.genSaltSync(10);
      const newInfluencer = {
        id: `inf_${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizePhone(phone),
        password: bcrypt.hashSync(password, salt),
        role: 'influencer',
        specialization: specialization || 'Content Creator & Expert',
        category: category || 'General',
        bio:
          bio ||
          'Passionate professional connecting with community and clients.',
        hourlyRate: Number(hourlyRate) || 150,
        introVideoUrl,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
        status: 'pending_review', // Important: initially under review
        isVerified: false,
        certificateStatus: certificateFile || certificateTitle ? 'pending' : 'none',
        certification: certificateFile || certificateTitle ? certData : null,
        availability: normalizeAvailability(parsedAvailability),
        createdAt: new Date().toISOString(),
      };

      data.influencers.push(newInfluencer);
      db.write(data);

      // Prompt rule: "While registration the first msg is shown to influencer is your account is under review"
      return res.status(201).json({
        success: true,
        status: 'pending_review',
        message:
          'Your account is under review. You will be able to access your dashboard once approved.',
        influencer: {
          id: newInfluencer.id,
          name: newInfluencer.name,
          email: newInfluencer.email,
          role: 'influencer',
          status: newInfluencer.status,
        },
      });
    } catch (err) {
      console.error('Error registering influencer:', err);
      return res.status(500).json({ error: 'Failed to register influencer' });
    }
  },
);

/**
 * USER REGISTRATION
 * User will enter his basic details (name, email, phone, password)
 */
router.post('/register-user', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const fields = registrationErrors(req.body, 'user');
    if (Object.keys(fields).length)
      return res.status(400).json({ error: Object.values(fields)[0], fields });

    const data = db.read();
    const duplicates = identityErrors(data, { email, phone });
    if (Object.keys(duplicates).length) return res.status(409).json({ error: Object.values(duplicates)[0], fields: duplicates });

    const salt = bcrypt.genSaltSync(10);
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizePhone(phone),
      password: bcrypt.hashSync(password, salt),
      role: 'user',
      status: 'approved', // Active user
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    db.write(data);

    const token = generateToken({
      id: newUser.id,
      role: 'user',
      email: newUser.email,
    });
    return res.status(201).json({
      success: true,
      message: 'User registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: 'user',
        status: newUser.status,
        avatar: newUser.avatar,
      },
    });
  } catch (err) {
    console.error('Error registering user:', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * ADMIN REGISTRATION (Optional helper or default login)
 */
router.post('/register-admin', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required' });
    }

    const data = db.read();
    const duplicates = identityErrors(data, { email, phone });
    if (Object.keys(duplicates).length) return res.status(409).json({ error: Object.values(duplicates)[0], fields: duplicates });

    const salt = bcrypt.genSaltSync(10);
    const newAdmin = {
      id: `adm_${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      password: bcrypt.hashSync(password, salt),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    data.admins.push(newAdmin);
    db.write(data);

    const token = generateToken({
      id: newAdmin.id,
      role: 'admin',
      email: newAdmin.email,
    });
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: 'admin',
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register admin' });
  }
});

/**
 * UNIFIED LOGIN WITH ROLE SUPPORT: admin, user, influencer
 */
router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = db.read();
    const targetRole = role ? role.toLowerCase() : null;

    // Check Influencer Login
    if (targetRole === 'influencer') {
      const influencer = data.influencers.find(
        (i) => i.email.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (!influencer) {
        return res
          .status(401)
          .json({ error: 'No influencer account found with this email' });
      }

      const match = bcrypt.compareSync(password, influencer.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Prompt rule: "When the admin approves the influencer request only then the influencer will be active for login otherwise a popup is shown that the account is under selected status by the admin"
      if (influencer.status === 'blocked') {
        const reason = influencer.statusReason || 'Please contact support.';
        const message = `Your account has been blocked. Reason: ${reason}`;
        return res.status(403).json({
          success: false,
          status: 'blocked',
          role: 'influencer',
          reason,
          error: message,
          message,
        });
      }

      if (influencer.status === 'pending_review') {
        return res.status(403).json({
          success: false,
          status: 'pending_review',
          role: 'influencer',
          message:
            'Your account is under review. You will be able to access your dashboard once approved.',
        });
      }

      if (influencer.status === 'rejected') {
        return res.status(403).json({
          success: false,
          status: 'rejected',
          role: 'influencer',
          message: influencer.statusReason
            ? `Your account application was declined: ${influencer.statusReason}`
            : 'Your account has been rejected. Please contact support.',
        });
      }

      // Approved! Generate token and return dashboard access
      const token = generateToken({
        id: influencer.id,
        role: 'influencer',
        email: influencer.email,
      });
      const { password: _, ...safeInfluencer } = influencer;
      return res.json({
        success: true,
        token,
        user: safeInfluencer,
      });
    }

    // Check User Login
    if (targetRole === 'user') {
      const user = data.users.find(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (!user) {
        return res
          .status(401)
          .json({ error: 'No user account found with this email' });
      }

      const match = bcrypt.compareSync(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      if (['blocked', 'rejected'].includes(user.status)) {
        const message =
          user.status === 'blocked'
            ? `Your account has been blocked. Reason: ${user.statusReason || 'Please contact support.'}`
            : 'Your account has been rejected. Please contact support.';
        return res.status(403).json({
          success: false,
          status: user.status,
          role: 'user',
          reason: user.statusReason || '',
          error: message,
          message,
        });
      }

      if (user.status === 'pending_review') {
        user.status = 'approved';
        user.statusReason = '';
        if (!db.write(data)) return res.status(503).json({ error: 'Unable to activate your account. Please try again.' });
      }

      const token = generateToken({
        id: user.id,
        role: 'user',
        email: user.email,
      });
      const { password: _, ...safeUser } = user;
      return res.json({
        success: true,
        token,
        user: safeUser,
      });
    }

    // Check Admin Login
    if (targetRole === 'admin') {
      const admin = data.admins.find(
        (a) => a.email.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (!admin) {
        return res.status(401).json({ error: 'Admin credentials not found' });
      }

      const match = bcrypt.compareSync(password, admin.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const token = generateToken({
        id: admin.id,
        role: 'admin',
        email: admin.email,
      });
      const { password: _, ...safeAdmin } = admin;
      return res.json({
        success: true,
        token,
        user: safeAdmin,
      });
    }

    return res.status(400).json({
      error: 'Please specify a valid role (admin, user, or influencer)',
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal login error' });
  }
});

/**
 * Verify Session / Me
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const data = db.read();
    let account = null;

    if (decoded.role === 'admin') {
      account = data.admins.find((a) => a.id === decoded.id);
    } else if (decoded.role === 'influencer') {
      account = data.influencers.find((i) => i.id === decoded.id);
    } else if (decoded.role === 'user') {
      account = data.users.find((u) => u.id === decoded.id);
    }

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if ((decoded.sessionVersion || 0) !== (account.sessionVersion || 0))
      return res.status(401).json({ error: 'Your password changed. Please sign in again.' });

    if (
      ['user', 'influencer'].includes(decoded.role) &&
      (['blocked', 'rejected'].includes(account.status) || (decoded.role === 'influencer' && account.status === 'pending_review'))
    ) {
      return res.status(403).json({
        error: 'Account access is restricted.',
        status: account.status,
      });
    }

    const { password: _, ...safeAccount } = account;
    return res.json({ user: safeAccount });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
