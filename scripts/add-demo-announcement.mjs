import { createRequire } from 'node:module';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
require('dotenv').config({ path: new URL('../backend/.env', import.meta.url).pathname });
const { db } = await import('../backend/src/db.js');
const demo = {
  id: 'demo-announcement-oct-2026',
  title: 'Welcome to MeetFame',
  message: 'Discover influencers, explore their availability, and book your next one-on-one session. This is a demo announcement.',
  audience: 'all', sent: 0,
  activeFrom: '2026-10-20T18:30:00.000Z',
  expiresAt: '2026-10-28T18:29:59.000Z',
  createdAt: new Date().toISOString(),
};
if (process.env.MONGODB_URI) {
  const { mongoConnection } = await import('../backend/src/mongoConnection.js');
  const { Announcement } = await import('../backend/src/models/Announcement.js');
  await mongoConnection.connect();
  await Announcement.updateOne({ id: demo.id }, { $setOnInsert: { ...demo, _version: 0 } }, { upsert: true });
  await require('mongoose').disconnect();
}
const data = db.read();
data.announcements ||= [];
if (!data.announcements.some(item => item.id === demo.id)) {
  data.announcements.push(demo);
  if (!db.write(data)) throw new Error('Unable to save demo announcement');
}
console.log('Demo announcement saved: 21–28 Oct, 2026 (IST).');
