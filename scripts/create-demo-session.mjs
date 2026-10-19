import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../backend/src/db.js';
import { mongoStore } from '../backend/src/mongoStore.js';
import { bookingWindow } from '../shared/bookingTime.js';

dotenv.config({
  path: fileURLToPath(new URL('../backend/.env', import.meta.url)),
  quiet: true,
});

try {
  const snapshot = process.env.MONGODB_URI ? await mongoStore.load() : null;
  const data = snapshot ? structuredClone(snapshot.state) : db.read();
  const password = `Demo-${randomUUID().slice(0, 12)}!`;
  const hash = await bcrypt.hash(password, 10);
  function demoAccount(collection, name, email, role) {
    let account = collection.find((item) => item.email === email);
    if (!account) {
      account = {
        id: `demo_${randomUUID()}`,
        name,
        email,
        password: hash,
        role,
        status: 'approved',
        phone: '+1 555-0100',
        createdAt: new Date().toISOString(),
      };
      if (role === 'influencer')
        Object.assign(account, {
          specialization: 'Video call testing',
          category: 'Technology & AI',
          bio: 'Demo account for testing video sessions.',
          hourlyRate: 0,
          availability: {},
        });
      collection.push(account);
    }
    return account;
  }
  const user = demoAccount(
    data.users,
    'Demo User',
    'demo.user@meetfame.com',
    'user',
  );
  const influencer = demoAccount(
    data.influencers,
    'Demo Influencer',
    'demo.influencer@meetfame.com',
    'influencer',
  );
  const now = Date.now();
  const existing = data.bookings.find(
    (item) =>
      item.topic === 'Demo video session — testing only' &&
      item.userId === user.id &&
      item.influencerId === influencer.id &&
      item.status === 'confirmed' &&
      bookingWindow(item)?.end > now,
  );
  if (existing) {
    console.log(
      JSON.stringify({
        message: 'An active demo session already exists.',
        date: existing.date,
        slot: existing.slot,
        timezone: 'IST',
      }),
    );
  } else {
    const ist = new Date(now + 19800000);
    const date = ist.toISOString().slice(0, 10);
    const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    const end = Math.min(minutes + 60, 1440);
    const time = (value) =>
      `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    const slot = `${time(minutes)} - ${time(end)}`;
    const window = bookingWindow({ date, slot });
    const conflict = data.bookings.some((item) => {
      if (
        item.status !== 'confirmed' ||
        (item.userId !== user.id && item.influencerId !== influencer.id)
      )
        return false;
      const other = bookingWindow(item);
      return other && other.start < window.end && other.end > window.start;
    });
    if (conflict)
      throw new Error(
        'A confirmed booking overlaps this demo. Try after the existing session ends.',
      );
    const booking = {
      id: `demo_${randomUUID()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      influencerId: influencer.id,
      influencerName: influencer.name,
      date,
      slot,
      slotLabel: slot,
      dayOfWeek: [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ][ist.getUTCDay()],
      topic: 'Demo video session — testing only',
      meetingType: 'video',
      status: 'confirmed',
      price: 0,
      createdAt: new Date(now).toISOString(),
    };
    user.password = hash;
    influencer.password = hash;
    data.bookings.push(booking);
    if (snapshot) await mongoStore.commit(snapshot, data);
    else if (!db.write(data)) throw new Error('Unable to save demo booking.');
    console.log(
      JSON.stringify({
        message: 'Demo session created.',
        password,
        user: user.email,
        influencer: influencer.email,
        date,
        slot,
        timezone: 'IST',
        storage: snapshot ? 'MongoDB' : 'local',
      }),
    );
  }
} catch (error) {
  console.error(
    'Demo session could not be created:',
    error.code || error.name,
    error.message?.startsWith('A confirmed') ||
      error.message?.startsWith('Approved')
      ? error.message
      : 'Check database connectivity.',
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
