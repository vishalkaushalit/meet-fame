import { db } from './db.js';
import { randomUUID } from 'node:crypto';
import { uploadToStorage } from './blobStorage.js';
import { profileImageError, profileImageExtension } from './profileUpload.js';
import { identityErrors } from './accountIdentity.js';
import { normalizePhone, phoneError } from '../../shared/phoneValidation.js';
import { REGISTRATION_CATEGORIES } from '../../shared/registrationValidation.js';

export async function updateOwnProfile(req, res) {
  const { id, role } = req.session;
  if (!['user', 'influencer'].includes(role) || (req.params?.id && req.params.id !== id))
    return res.status(403).json({ error: 'You can only edit your own profile.' });
  const data = db.read();
  const collection = role === 'user' ? data.users : data.influencers;
  const account = collection.find((item) => item.id === id);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  const changes = {};
  const fields = {};
  const input = req.body || {};
  for (const [key, limit] of Object.entries({ name: 100, email: 254, phone: 40, avatar: 2048, ...(role === 'influencer' ? { bio: 2000, specialization: 200, category: 100 } : {}) })) {
    if (!Object.hasOwn(input, key)) continue;
    if (typeof input[key] !== 'string' || input[key].trim().length > limit) { fields[key] = `Enter a valid ${key} (up to ${limit} characters).`; continue; }
    changes[key] = input[key].trim();
  }
  if ('name' in changes && !changes.name) fields.name = 'Enter your name.';
  if ('email' in changes) {
    changes.email = changes.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email)) fields.email = 'Enter a valid email address.';
    else if (collection.some((item) => item.id !== id && item.email.toLowerCase() === changes.email)) fields.email = 'This email address is already in use.';
  }
  if ('phone' in changes) {
    const error = phoneError(changes.phone, true);
    if (error) fields.phone = error; else changes.phone = normalizePhone(changes.phone);
  }
  if (!('phone' in changes) && !account.phone?.trim()) fields.phone = 'Enter a phone number.';
  if (changes.avatar && changes.avatar !== account.avatar && !req.file) {
    try { if (new URL(changes.avatar).protocol !== 'https:') throw new Error(); }
    catch { fields.avatar = 'Enter a valid HTTPS image URL.'; }
  }
  if ('specialization' in changes && !changes.specialization) fields.specialization = 'Enter your specialization.';
  if ('category' in changes && !REGISTRATION_CATEGORIES.includes(changes.category)) fields.category = 'Select a valid category.';
  if (role === 'influencer' && Object.hasOwn(input, 'hourlyRate')) {
    const rate = req.is?.('multipart/form-data') ? Number(input.hourlyRate) : input.hourlyRate;
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || rate > 1000000)
      fields.hourlyRate = 'Enter an hourly rate between $0.01 and $1,000,000.';
    else changes.hourlyRate = Math.round(rate * 100) / 100;
  }
  const imageIssue = profileImageError(req.file);
  if (imageIssue) fields.avatar = imageIssue;
  const duplicates = identityErrors(data, { ...account, ...changes }, { collection: role === 'user' ? 'users' : 'influencers', id });
  if (!Object.keys(fields).length && Object.keys(duplicates).length) return res.status(409).json({ error: Object.values(duplicates)[0], fields: duplicates });
  if (Object.keys(fields).length) return res.status(400).json({ error: Object.values(fields)[0], fields });
  if (req.file) {
    try {
      const url = await uploadToStorage({ ...req.file, originalname: `${randomUUID()}${profileImageExtension(req.file)}` }, 'avatar');
      changes.avatar = url.startsWith('/uploads/') ? new URL(url, process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5001}`).href : url;
    } catch { return res.status(503).json({ error: 'Unable to upload your photo. Please try again.', fields: { avatar: 'Photo upload failed.' } }); }
  }
  Object.assign(account, changes, { updatedAt: new Date().toISOString() });
  if (!db.write(data)) return res.status(503).json({ error: 'Unable to save your profile. Please try again.' });
  const { password: _, ...user } = account;
  return res.json({ user, ...(role === 'influencer' ? { influencer: user } : {}) });
}
