import mongoose from 'mongoose';
import { db } from './db.js';
import { normalizeAvailability } from '../../shared/availability.js';
const collections = ['users', 'influencers', 'admins', 'bookings', 'messages', 'notifications'];
let initialized;
const slotKey = booking => booking.status !== 'cancelled' ? `${booking.influencerId}:${booking.date}:${booking.slot}` : undefined;
const stored = (name, item, version, id) => {
  const record = { ...item, _version: version };
  if (id) record._id = id;
  if (name === 'bookings' && slotKey(item)) record._activeSlot = slotKey(item);
  return record;
};
async function initialize() {
  if (mongoose.connection.readyState === 2) await mongoose.connection.asPromise();
  if (mongoose.connection.readyState !== 1) throw new Error('MongoDB is not connected');
  const mongo = mongoose.connection.db;
  const local = db.read();
  // Import the retained JSON records once per collection, without overwriting
  // records already maintained in MongoDB.
  for (const name of collections) {
    await mongo.collection(name).createIndex({ id: 1 }, { unique: true, partialFilterExpression: { id: { $type: 'string' } } });
    if (!local[name]?.length || await mongo.collection(name).countDocuments({}, { limit: 1 })) continue;
    for (const item of local[name]) {
      try {
        await mongo.collection(name).updateOne({ id: item.id }, { $setOnInsert: stored(name, item, 0) }, { upsert: true });
      } catch (error) {
        // Another cold-start instance may have inserted this seed simultaneously.
        if (error.code !== 11000 || !await mongo.collection(name).findOne({ id: item.id })) throw error;
      }
    }
  }
  for await (const booking of mongo.collection('bookings').find({ status: { $ne: 'cancelled' }, _activeSlot: { $exists: false } })) {
    await mongo.collection('bookings').updateOne({ _id: booking._id, _activeSlot: { $exists: false } }, { $set: { _activeSlot: slotKey(booking) } });
  }
  await mongo.collection('notifications').createIndex({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });
  await mongo.collection('bookings').createIndex({ _activeSlot: 1 }, { unique: true, partialFilterExpression: { _activeSlot: { $type: 'string' } } });
}
export const mongoStore = {
  async load() {
    if (!initialized) initialized = initialize().catch(error => { initialized = null; throw error; });
    await initialized;
    const local = db.read();
    const state = {}, originals = {};
    await Promise.all(collections.map(async name => {
      const records = await mongoose.connection.db.collection(name).find({}).toArray();
      originals[name] = new Map();
      state[name] = records.map(record => {
        const { _id, _version, _activeSlot, ...value } = record;
        const match = !value.id && value.email ? (local[name] || []).find(item => item.email?.toLowerCase() === value.email.toLowerCase()) : null;
        value.id ||= match?.id || String(_id);
        if (name === 'influencers') value.availability = normalizeAvailability(value.availability);
        originals[name].set(value.id, { _id, version: _version, value: structuredClone(value) });
        return value;
      });
    }));
    return { state, originals };
  },
  async commit(snapshot, state) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const name of collections) {
          for (const item of state[name] || []) {
            const original = snapshot.originals[name].get(item.id);
            if (original && JSON.stringify(original.value) === JSON.stringify(item)) continue;
            if (!original) {
              await mongoose.connection.db.collection(name).insertOne(stored(name, item, 0), { session });
            } else {
              const filter = { _id: original._id, _version: original.version ?? { $exists: false } };
              const result = await mongoose.connection.db.collection(name).replaceOne(filter, stored(name, item, (original.version || 0) + 1, original._id), { session });
              if (!result.matchedCount) throw Object.assign(new Error('Concurrent record update'), { code: 'WRITE_CONFLICT' });
            }
          }
        }
      });
    } finally { await session.endSession(); }
  }
};
