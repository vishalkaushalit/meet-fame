import mongoose from 'mongoose';
const schema = new mongoose.Schema({ _id: String, version: Number, state: mongoose.Schema.Types.Mixed, expiresAt: Date });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Room = mongoose.models.CallRoom || mongoose.model('CallRoom', schema);
const localRooms = new Map();
export async function mutateRoom(id, update) {
  if (!process.env.MONGODB_URI && !process.env.VERCEL) {
    const current = localRooms.get(id);
    const state = current && current.expiresAt > Date.now() ? current.state : { members: {}, signals: [], sequence: 0 };
    const result = update(state);
    localRooms.set(id, { state, expiresAt: Date.now() + 7200000 });
    for (const [key, room] of localRooms) if (room.expiresAt < Date.now()) localRooms.delete(key);
    return result;
  }
  if (mongoose.connection.readyState !== 1) throw new Error('Video signaling requires a connected MongoDB database.');
  try {
    await Room.updateOne({ _id: id }, { $setOnInsert: { version: 0, state: { members: {}, signals: [], sequence: 0 }, expiresAt: new Date(Date.now() + 7200000) } }, { upsert: true });
  } catch (error) {
    // Both participants can create the room at the same instant.
    if (error.code !== 11000) throw error;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const room = await Room.findById(id).lean();
    const state = room.expiresAt > new Date() ? room.state : { members: {}, signals: [], sequence: 0 };
    const result = update(state);
    const saved = await Room.updateOne({ _id: id, version: room.version }, { $set: { state, expiresAt: new Date(Date.now() + 7200000) }, $inc: { version: 1 } });
    if (saved.modifiedCount) return result;
  }
  throw new Error('Call room is busy. Please retry.');
}
