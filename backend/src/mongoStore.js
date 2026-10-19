import mongoose from 'mongoose';
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
  users: User,
  influencers: Influencer,
  admins: Admin,
  bookings: Booking,
  messages: Message,
  notifications: Notification,
};
const collections = Object.keys(persistenceModels);
let initialized;
const slotKey = (booking) =>
  booking.status !== 'cancelled'
    ? `${booking.influencerId}:${booking.date}:${booking.slot}`
    : undefined;
const stored = (name, item, version, id) => {
  const record = { ...item, _version: version };
  if (id) record._id = id;
  if (name === 'bookings' && slotKey(item)) record._activeSlot = slotKey(item);
  return record;
};
async function initialize() {
  await mongoConnection.connect();
  const local = db.read();
  // Import the retained JSON records once per collection, without overwriting
  // records already maintained in MongoDB.
  for (const name of collections) {
    const Model = persistenceModels[name];
    await Model.createIndexes();
    if (!local[name]?.length || (await Model.countDocuments({}).limit(1)))
      continue;
    for (const item of local[name]) {
      try {
        await Model.updateOne(
          { id: item.id },
          { $setOnInsert: stored(name, item, 0) },
          { upsert: true, runValidators: true, timestamps: false },
        );
      } catch (error) {
        // Another cold-start instance may have inserted this seed simultaneously.
        if (error.code !== 11000 || !(await Model.exists({ id: item.id })))
          throw error;
      }
    }
  }
  for await (const booking of Booking.find({
    status: { $ne: 'cancelled' },
    _activeSlot: { $exists: false },
  })
    .lean()
    .cursor()) {
    await Booking.updateOne(
      { _id: booking._id, _activeSlot: { $exists: false } },
      { $set: { _activeSlot: slotKey(booking) } },
    );
  }
}
export const mongoStore = {
  async load() {
    await mongoConnection.connect();
    if (!initialized)
      initialized = initialize().catch((error) => {
        initialized = null;
        throw error;
      });
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
              ? (local[name] || []).find(
                  (item) =>
                    item.email?.toLowerCase() === value.email.toLowerCase(),
                )
              : null;
          value.id ||= match?.id || String(_id);
          if (name === 'influencers')
            value.availability = normalizeAvailability(value.availability);
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
        for (const name of collections) {
          for (const item of state[name] || []) {
            const original = snapshot.originals[name].get(item.id);
            if (
              original &&
              JSON.stringify(original.value) === JSON.stringify(item)
            )
              continue;
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
              if (!result.matchedCount)
                throw Object.assign(new Error('Concurrent record update'), {
                  code: 'WRITE_CONFLICT',
                });
            }
          }
        }
      });
    } finally {
      await session.endSession();
    }
  },
};
