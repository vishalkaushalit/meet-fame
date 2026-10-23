import mongoose from 'mongoose';
import { BankDetails } from './models/BankDetails.js';
import { createHash } from 'node:crypto';
import { AccountIdentityLock } from './models/AccountIdentityLock.js';
import {
  accountCollections,
  normalizedIdentity,
  identityErrors,
} from './accountIdentity.js';
import { PasswordReset } from './models/PasswordReset.js';
import { Transaction } from './models/Transaction.js';
import { Announcement } from './models/Announcement.js';
import { mongoConnection } from './mongoConnection.js';
import { db } from './db.js';
import { normalizeAvailability } from '../../shared/availability.js';
import { User } from './models/User.js';
import { Influencer } from './models/Influencer.js';
import { Admin } from './models/Admin.js';
import { Booking } from './models/Booking.js';
import { Message } from './models/Message.js';
import { Notification } from './models/Notification.js';
export const persistenceModels = {
  bankdetails: BankDetails,
  passwordresets: PasswordReset,
  transactions: Transaction,
  announcements: Announcement,
  users: User,
  influencers: Influencer,
  admins: Admin,
  bookings: Booking,
  messages: Message,
  notifications: Notification,
};
const collections = Object.keys(persistenceModels);
let initialized;
const slotKey = (booking) => {
  return booking.status !== 'cancelled'
    ? `${booking.influencerId}:${booking.date}:${booking.slot}`
    : undefined;
};
const stored = (name, item, version, id) => {
  const record = { ...item, _version: version };
  if (id) {
    record._id = id;
  }
  if (name === 'bookings' && slotKey(item)) {
    record._activeSlot = slotKey(item);
  }
  return record;
};
async function initialize() {
  await mongoConnection.connect();
  await AccountIdentityLock.createCollection();
  const local = db.read();
  // Import the retained JSON records once per collection, without overwriting
  // records already maintained in MongoDB.
  for (const name of collections) {
    const Model = persistenceModels[name];
    await Model.createIndexes();
    if (!local[name]?.length || (await Model.countDocuments({}).limit(1))) {
      continue;
    }
    for (const item of local[name]) {
      try {
        await Model.updateOne(
          { id: item.id },
          { $setOnInsert: stored(name, item, 0) },
          { upsert: true, runValidators: true, timestamps: false },
        );
      } catch (error) {
        // Another cold-start instance may have inserted this seed simultaneously.
        if (error.code !== 11000 || !(await Model.exists({ id: item.id }))) {
          throw error;
        }
      }
    }
  }
  for await (const booking of Booking.find({
    status: { $ne: 'cancelled' },
    _activeSlot: { $exists: false },
  }).lean().cursor()) {
    await Booking.updateOne(
      { _id: booking._id, _activeSlot: { $exists: false } },
      { $set: { _activeSlot: slotKey(booking) } },
    );
  }
}
export const mongoStore = {
  async load() {
    await mongoConnection.connect();
    if (!initialized) {
      initialized = initialize().catch((error) => {
        initialized = null;
        throw error;
      });
    }
    await initialized;
    const local = db.read();
    const state = {},
      originals = {};
    await Promise.all(
      collections.map(async (name) => {
        const records = await persistenceModels[name].find({}).lean().exec();
        originals[name] = new Map();
        state[name] = records.map((record) => {
          const { _id, _version, _activeSlot, ...fields } = record;
          // Keep the existing API contract (ISO strings) while models store Dates.
          const value = JSON.parse(JSON.stringify(fields));
          const match =
            !value.id && value.email
              ? (local[name] || []).find((item) => {
                  return (
                    item.email?.toLowerCase() === value.email.toLowerCase()
                  );
                })
              : null;
          value.id ||= match?.id || String(_id);
          if (name === 'influencers') {
            value.availability = normalizeAvailability(value.availability);
          }
          originals[name].set(value.id, {
            _id,
            version: _version,
            value: structuredClone(value),
          });
          return value;
        });
      }),
    );
    return { state, originals };
  },
  async commit(snapshot, state) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const changed = [];
        for (const name of accountCollections) {
          for (const item of state[name] || []) {
            const previous = snapshot.originals[name]?.get(item.id)?.value;
            if (
              !previous ||
              JSON.stringify(normalizedIdentity(previous)) !==
                JSON.stringify(normalizedIdentity(item))
            ) {
              changed.push({ name, item });
            }
          }
        }
        if (changed.length) {
          // Serialize claims across roles and instances, including brand-new accounts.
          const keys = [
            ...new Set(
              changed.flatMap(({ item }) => {
                return Object.entries(normalizedIdentity(item)).filter(([, value]) => {
                    return value;
                  }).map(([field, value]) => {
                    return createHash('sha256').update(`${field}:${value}`).digest('hex');
                  });
              }),
            ),
          ].sort();
          for (const key of keys) {
            await AccountIdentityLock.updateOne(
              { _id: key },
              { $inc: { revision: 1 } },
              { session, upsert: true },
            );
          }
          const current = {};
          for (const name of accountCollections) {
            current[name] = await persistenceModels[name].find({}, { id: 1, email: 1, phone: 1 }).session(session).lean();
          }
          for (const { name, item } of changed) {
            const fields = {
              ...identityErrors(current, item, {
                collection: name,
                id: item.id,
              }),
              ...identityErrors(state, item, { collection: name, id: item.id }),
            };
            if (Object.keys(fields).length) {
              throw Object.assign(new Error(Object.values(fields)[0]), {
                code: 'ACCOUNT_IDENTITY_CONFLICT',
                fields,
              });
            }
          }
        }
        for (const name of collections) {
          // Announcement removal also removes its delivered notifications.
          if (
            ['announcements', 'notifications'].includes(name) &&
            Array.isArray(state[name])
          ) {
            const retained = new Set(
              state[name].map((item) => {
                return item.id;
              }),
            );
            for (const [id, original] of snapshot.originals[name]) {
              if (retained.has(id)) {
                continue;
              }
              const result = await persistenceModels[name].deleteOne(
                {
                  _id: original._id,
                  _version: original.version ?? { $exists: false },
                },
                { session },
              );
              if (!result.deletedCount) {
                throw Object.assign(new Error('Concurrent record deletion'), {
                  code: 'WRITE_CONFLICT',
                });
              }
            }
          }
          for (const item of state[name] || []) {
            const original = snapshot.originals[name].get(item.id);
            if (
              original &&
              JSON.stringify(original.value) === JSON.stringify(item)
            ) {
              continue;
            }
            if (!original) {
              await persistenceModels[name].create([stored(name, item, 0)], {
                session,
              });
            } else {
              const filter = {
                _id: original._id,
                _version: original.version ?? { $exists: false },
              };
              const result = await persistenceModels[name].replaceOne(
                filter,
                stored(name, item, (original.version || 0) + 1, original._id),
                { session, runValidators: true, timestamps: false },
              );
              if (!result.matchedCount) {
                throw Object.assign(new Error('Concurrent record update'), {
                  code: 'WRITE_CONFLICT',
                });
              }
            }
          }
        }
      });
    } finally {
      await session.endSession();
    }
  },
};
