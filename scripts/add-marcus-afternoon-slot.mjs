import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { db } from '../backend/src/db.js';
import { normalizeAvailability, WEEK_DAYS } from '../shared/availability.js';
import { generateDaySlots } from '../backend/src/slotUtils.js';

function addSlot(availability) {
  const normalized = normalizeAvailability(availability);
  for (const day of WEEK_DAYS) {
    if (
      generateDaySlots(normalized[day]).some((slot) => {
        return slot.slotId === '13:00 - 14:00';
      })
    ) {
      continue;
    }
    normalized[day].ranges.push({ start: '13:00', end: '14:00' });
    normalized[day].ranges.sort((a, b) => {
      return a.start.localeCompare(b.start);
    });
  }
  return normalized;
}
function verified(availability) {
  return WEEK_DAYS.every((day) => {
    return generateDaySlots(availability[day]).some((slot) => {
      return slot.slotId === '13:00 - 14:00';
    });
  });
}
dotenv.config({
  path: fileURLToPath(new URL('../backend/.env', import.meta.url)),
  quiet: true,
});
try {
  if (!process.env.MONGODB_URI) {
    throw new Error('MongoDB configuration missing');
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  const collection = mongoose.connection.db.collection('influencers');
  const creator = await collection.findOne({ name: /^Marcus Vance$/i });
  if (!creator) {
    throw new Error('Marcus Vance not found in MongoDB');
  }
  const next = addSlot(creator.availability);
  const update = await collection.updateOne(
    { _id: creator._id, availability: creator.availability },
    { $set: { availability: next } },
  );
  if (!update.matchedCount) {
    throw new Error('Schedule changed concurrently; retry');
  }
  const remote = await collection.findOne({ _id: creator._id });
  if (!verified(remote.availability)) {
    throw new Error('MongoDB verification failed');
  }
  const local = db.read();
  const account = local.influencers.find((item) => {
    return /^Marcus Vance$/i.test(item.name);
  });
  if (!account) {
    throw new Error('Local Marcus Vance not found');
  }
  account.availability = addSlot(account.availability);
  if (!db.write(local)) {
    throw new Error('Local save failed');
  }
  if (
    !verified(
      db.read().influencers.find((item) => {
        return item.id === account.id;
      }).availability,
    )
  ) {
    throw new Error('Local verification failed');
  }
  console.log(
    JSON.stringify({
      name: 'Marcus Vance',
      slot: '1–2 PM IST',
      days: 7,
      localVerified: true,
      mongoVerified: true,
    }),
  );
} catch (error) {
  console.error('Unable to complete slot update:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
