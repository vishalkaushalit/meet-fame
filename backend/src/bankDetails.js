import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { db } from './db.js';

const owner = (req) => {
  return req.session && ['admin', 'influencer'].includes(req.session.role)
    ? req.session
    : null;
};
const summary = (record) => {
  return record ? { ...record.summary, updatedAt: record.updatedAt } : null;
};

export function getBankDetails(req, res) {
  const session = owner(req);
  if (!session) {
    return res.status(403).json({
      error:
        'Bank details are available to administrators and influencers only.',
    });
  }
  const record = (db.read().bankdetails || []).find((item) => {
    return item.id === `${session.role}:${session.id}`;
  });
  res.set?.('Cache-Control', 'no-store');
  if (!record) {
    return res.json({ bankDetails: null });
  }
  try {
    const secret =
      process.env.BANK_DETAILS_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('Missing encryption key');
    }
    const key = createHash('sha256')
      .update(`meetfame-bank-details:${secret}`)
      .digest();
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(record.encrypted.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(record.encrypted.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(record.encrypted.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return res.json({
      bankDetails: {
        ...summary(record),
        ...JSON.parse(plaintext.toString('utf8')),
      },
    });
  } catch {
    return res.status(503).json({
      error:
        'Unable to load saved bank details. Check the server encryption key.',
    });
  }
}

export function saveBankDetails(req, res) {
  const session = owner(req);
  if (!session) {
    return res.status(403).json({
      error:
        'Bank details are available to administrators and influencers only.',
    });
  }
  const body = req.body || {};
  const fields = {};
  const values = {};
  for (const [key, limit] of Object.entries({
    accountHolder: 100,
    bankName: 100,
    country: 2,
    routingCode: 20,
    accountNumber: 34,
  })) {
    if (
      typeof body[key] !== 'string' ||
      !body[key].trim() ||
      body[key].trim().length > limit
    ) {
      fields[key] = 'Enter a valid value.';
    } else {
      values[key] = body[key].trim();
    }
  }
  values.country = values.country?.toUpperCase();
  values.routingCode = values.routingCode?.toUpperCase();
  if (!/^[A-Z]{2}$/.test(values.country || '')) {
    fields.country = 'Enter a two-letter country code, such as IN or US.';
  }
  if (!/^[A-Za-z0-9]{4,34}$/.test(values.accountNumber || '')) {
    fields.accountNumber =
      'Enter an account number or IBAN using 4–34 letters or digits.';
  }
  if (body.confirmAccountNumber !== values.accountNumber) {
    fields.confirmAccountNumber = 'Account numbers must match.';
  }
  if (!/^[A-Z0-9-]{4,20}$/.test(values.routingCode || '')) {
    fields.routingCode = 'Enter a valid IFSC, routing code, or SWIFT/BIC.';
  }
  if (
    values.country === 'IN' &&
    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(values.routingCode || '')
  ) {
    fields.routingCode = 'Enter a valid 11-character IFSC code.';
  }
  if (Object.keys(fields).length) {
    return res.status(400).json({
      error: 'Check your bank details.',
      fields,
    });
  }
  // Use a dedicated key where configured; never use the development JWT fallback.
  const secret =
    process.env.BANK_DETAILS_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({
      error:
        'Bank details storage requires a server encryption key of at least 32 characters.',
    });
  }
  try {
    const key = createHash('sha256')
      .update(`meetfame-bank-details:${secret}`)
      .digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(values), 'utf8'),
      cipher.final(),
    ]);
    const data = db.read();
    data.bankdetails ||= [];
    const id = `${session.role}:${session.id}`;
    const record = {
      id,
      ownerId: session.id,
      ownerRole: session.role,
      encrypted: {
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        ciphertext: ciphertext.toString('base64'),
      },
      summary: {
        accountHolder: values.accountHolder,
        bankName: values.bankName,
        country: values.country,
        maskedAccountNumber: `•••• ${values.accountNumber.slice(-4)}`,
      },
      updatedAt: new Date().toISOString(),
    };
    const index = data.bankdetails.findIndex((item) => {
      return item.id === id;
    });
    if (index < 0) {
      data.bankdetails.push(record);
    } else {
      data.bankdetails[index] = record;
    }
    if (!db.write(data)) {
      return res.status(503).json({
        error: 'Unable to save bank details. Please try again.',
      });
    }
    return res.json({ bankDetails: summary(record) });
  } catch {
    return res.status(503).json({
      error: 'Unable to save bank details. Please try again.',
    });
  }
}
