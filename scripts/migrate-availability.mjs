import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { normalizeAvailability, WEEK_DAYS } from '../shared/availability.js';

dotenv.config({
  path: fileURLToPath(new URL('../backend/.env', import.meta.url)),
  quiet: true,
});
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  const totals = { checked: 0, migrated: 0, concurrentChanges: 0 };
  for (const name of ['users', 'influencers', 'admins']) {
    const collection = mongoose.connection.db.collection(name);
    const accounts = collection.find(
      { availability: { $exists: true, $ne: null } },
      { projection: { availability: 1 } },
    );
    for await (const account of accounts) {
      totals.checked++;
      const availability = normalizeAvailability(account.availability);
      if (JSON.stringify(account.availability) === JSON.stringify(availability))
        continue;
      // Do not overwrite a schedule edited while this migration is running.
      const result = await collection.updateOne(
        { _id: account._id, availability: account.availability },
        { $set: { availability } },
      );
      totals.migrated += result.modifiedCount;
      if (!result.matchedCount) totals.concurrentChanges++;
    }
    for await (const account of collection.find(
      { availability: { $exists: true, $ne: null } },
      { projection: { availability: 1 } },
    )) {
      if (
        !WEEK_DAYS.every(
          (day) =>
            account.availability[day] &&
            !Array.isArray(account.availability[day]) &&
            Array.isArray(account.availability[day].ranges),
        )
      ) {
        throw new Error(
          `Availability verification failed in ${name}. Retry if an account was edited concurrently.`,
        );
      }
    }
  }
  console.log(JSON.stringify({ ...totals, verified: true }));
} catch (error) {
  // Connection errors can contain infrastructure details; never print the URI.
  console.error('Availability migration failed:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
