import {
  randomInt,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { databaseContext } from './databaseContext.js';

const collections = {
  user: 'users',
  influencer: 'influencers',
  admin: 'admins',
};
const developmentOtp = () => {
  return process.env.PASSWORD_RESET_TEST_OTP === '1111' ||
    (process.env.NODE_ENV !== 'production' && !process.env.VERCEL)
    ? '1111'
    : null;
};
const digest = (id, otp) => {
  return createHmac(
    'sha256',
    process.env.JWT_SECRET ||
      process.env.RESEND_API_KEY ||
      (developmentOtp() ? 'meetfame-local-otp-only' : ''),
  ).update(`${id}:${otp}`).digest('hex');
};
const validEmail = (email) => {
  return (
    typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
};
const message =
  'If an account matches that email, a 6-digit OTP will be sent. Check your inbox and spam folder. The code expires in 10 minutes.';
const requests = new Map();
export function recoveryRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  for (const [address, entry] of requests) {
    if (entry.until <= now) {
      requests.delete(address);
    }
  }
  if (!requests.has(key) && requests.size >= 10000) {
    return res.status(429).json({
      error: 'Please try again later.',
    });
  }
  const entry = requests.get(key) || { count: 0, until: now + 15 * 60000 };
  requests.set(key, entry);
  if (++entry.count > 10) {
    return res.status(429).json({
      error: 'Too many recovery attempts. Please try again in 15 minutes.',
    });
  }
  next();
}

export async function forgotPassword(req, res) {
  const { email, role } = req.body || {};
  if (!Object.hasOwn(collections, role) || !validEmail(email)) {
    return res.status(400).json({
      error: 'Enter a valid email address and account type.',
    });
  }
  const testOtp = developmentOtp();
  if (
    !testOtp &&
    (!process.env.RESEND_API_KEY || !process.env.PASSWORD_RESET_FROM)
  ) {
    return res.status(503).json({
      error:
        'Password recovery email is not configured. Please contact support.',
    });
  }
  const confirmation = {
    message,
    ...(testOtp ? { developmentOtp: testOtp } : {}),
  };
  const data = db.read();
  const account = data[collections[role]].find((item) => {
    return item.email.toLowerCase() === email.trim().toLowerCase();
  });
  if (!account) {
    return res.json(confirmation);
  }
  data.passwordresets ||= [];
  const id = `${role}:${account.id}`;
  const previous = data.passwordresets.find((item) => {
    return item.id === id;
  });
  if (previous && Date.now() - Date.parse(previous.createdAt) < 60000) {
    return res.json(confirmation);
  }
  const otp = testOtp || String(randomInt(0, 1000000)).padStart(6, '0');
  const record = {
    id,
    accountId: account.id,
    role,
    otpHash: digest(id, otp),
    attempts: 0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
    usedAt: null,
    verifiedAt: null,
    resetTokenHash: null,
    resetExpiresAt: null,
  };
  if (previous) {
    Object.assign(previous, record);
    delete previous.tokenHash;
  } else {
    data.passwordresets.push(record);
  }
  const deliver = async () => {
    if (
      testOtp &&
      (!process.env.RESEND_API_KEY || !process.env.PASSWORD_RESET_FROM)
    ) {
      return;
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.PASSWORD_RESET_FROM,
        to: [account.email],
        subject: 'Your MeetFame password reset OTP',
        text: `Your ${role} account password reset code is:\n\n${otp}\n\nEnter this code on MeetFame to set your new password. It expires in 10 minutes and can only be used once. Never share this code. If you did not request this, ignore this email.`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error(
        'Password recovery email could not be sent. Please try again in a minute.',
      );
    }
  };
  if (!db.write(data)) {
    return res.status(503).json({
      error: 'Unable to prepare password recovery. Please try again.',
    });
  }
  // Send only after the code hash is durably committed on production MongoDB.
  if (databaseContext.getStore()) {
    req.afterDatabaseCommit = deliver;
  } else {
    try {
      await deliver();
    } catch {
      return res.status(503).json({
        error:
          'Password recovery email could not be sent. Please try again in a minute.',
      });
    }
  }
  return res.json(confirmation);
}

export async function verifyOtp(req, res) {
  const { email, otp, role } = req.body || {};
  if (
    !Object.hasOwn(collections, role) ||
    !validEmail(email) ||
    typeof otp !== 'string' ||
    !(developmentOtp() ? /^\d{4,6}$/ : /^\d{6}$/).test(otp)
  ) {
    return res.status(400).json({
      error: 'Enter your email address and a valid OTP.',
    });
  }
  const data = db.read();
  const account = data[collections[role]].find((item) => {
    return item.email.toLowerCase() === email.trim().toLowerCase();
  });
  const record =
    account &&
    (data.passwordresets || []).find((item) => {
      return (
        item.id === `${role}:${account.id}` &&
        item.otpHash &&
        !item.usedAt &&
        !item.verifiedAt &&
        Date.parse(item.expiresAt) > Date.now() &&
        (item.attempts || 0) < 5
      );
    });
  if (!record) {
    return res.status(400).json({
      error: 'This OTP is invalid or expired. Request a new code.',
    });
  }
  const expected = digest(record.id, otp);
  if (
    record.otpHash.length !== expected.length ||
    !timingSafeEqual(Buffer.from(record.otpHash), Buffer.from(expected))
  ) {
    record.attempts = (record.attempts || 0) + 1;
    if (!db.write(data)) {
      return res.status(503).json({
        error: 'Unable to verify your OTP. Please retry.',
      });
    }
    req.persistDatabaseOnError = true;
    return res.status(400).json({
      error: 'This OTP is invalid or expired. Request a new code.',
    });
  }
  const resetToken = randomBytes(32).toString('hex');
  record.verifiedAt = new Date().toISOString();
  record.resetTokenHash = digest(`${record.id}:reset`, resetToken);
  record.resetExpiresAt = new Date(Date.now() + 5 * 60000).toISOString();
  if (!db.write(data)) {
    return res.status(503).json({
      error: 'Unable to verify your OTP. Please retry.',
    });
  }
  return res.json({
    message: 'OTP verified. Choose your new password.',
    resetToken,
  });
}

export async function resetPassword(req, res) {
  const { email, role, resetToken, password } = req.body || {};
  if (
    !Object.hasOwn(collections, role) ||
    !validEmail(email) ||
    typeof resetToken !== 'string' ||
    !/^[a-f0-9]{64}$/.test(resetToken)
  ) {
    return res.status(400).json({
      error: 'Verify your OTP before resetting your password.',
    });
  }
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password) > 72
  ) {
    return res.status(400).json({
      error:
        'Use at least 8 characters and no more than 72 bytes for your password.',
    });
  }
  const data = db.read();
  const account = data[collections[role]].find((item) => {
    return item.email.toLowerCase() === email.trim().toLowerCase();
  });
  const record =
    account &&
    (data.passwordresets || []).find((item) => {
      return (
        item.id === `${role}:${account.id}` &&
        item.verifiedAt &&
        !item.usedAt &&
        item.resetTokenHash &&
        Date.parse(item.resetExpiresAt) > Date.now()
      );
    });
  if (!record) {
    return res.status(400).json({
      error: 'Your reset session expired. Request and verify a new OTP.',
    });
  }
  const expected = digest(`${record.id}:reset`, resetToken);
  if (
    record.resetTokenHash.length !== expected.length ||
    !timingSafeEqual(Buffer.from(record.resetTokenHash), Buffer.from(expected))
  ) {
    return res.status(400).json({
      error: 'Your reset session is invalid. Request and verify a new OTP.',
    });
  }
  account.password = await bcrypt.hash(password, 10);
  account.sessionVersion = (account.sessionVersion || 0) + 1;
  record.usedAt = new Date().toISOString();
  record.resetTokenHash = null;
  if (!db.write(data)) {
    return res.status(503).json({
      error: 'Unable to save your new password. Please retry.',
    });
  }
  return res.json({
    message: 'Password updated. You can now sign in with your new password.',
  });
}
