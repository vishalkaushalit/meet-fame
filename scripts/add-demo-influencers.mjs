import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { createRequire } from 'node:module';
const mongoose = createRequire(
  new URL('../backend/package.json', import.meta.url),
)('mongoose');
import bcrypt from 'bcryptjs';
import { put } from '@vercel/blob';
import { parseBuffer } from 'music-metadata';
import { Influencer } from '../backend/src/models/Influencer.js';
import { normalizeAvailability } from '../shared/availability.js';

const root = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(root, 'backend/.env'), quiet: true });
const profiles = JSON.parse(
  await fs.readFile(
    new URL('./fixtures/demo-influencers.json', import.meta.url),
    'utf8',
  ),
);
const directory = process.argv[2] || '/tmp/meetfame-demo-videos';
if (process.argv.includes('--prepare')) {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, 'new-profiles.json'),
    JSON.stringify({ influencers: profiles }),
  );
  console.log('Prepared demo video manifest.');
} else {
  try {
    if (!process.env.MONGODB_URI || !process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('Missing configuration');
    }
    // Verify every clip before making any changes.
    const videos = new Map();
    for (const profile of profiles) {
      const buffer = await fs.readFile(
        path.join(directory, `${profile.id}.mp4`),
      );
      const metadata = await parseBuffer(buffer, { mimeType: 'video/mp4' });
      const duration =
        metadata.format.containerDuration || metadata.format.duration;
      if (
        !metadata.format.hasVideo ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        duration > 15 ||
        buffer.length > 5 * 1024 * 1024
      ) {
        throw new Error('Invalid demo video');
      }
      videos.set(profile.id, buffer);
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    let added = 0;
    const localPath = path.join(root, 'backend/data/db.json');
    for (const [index, profile] of profiles.entries()) {
      const email = `${profile.id}@demo.meetfame.example`;
      let record = await Influencer.findOne({
        $or: [{ id: profile.id }, { email }],
      }).lean();
      if (!record) {
        const blob = await put(
          `introduction_video/intro-demo-${profile.id}.mp4`,
          videos.get(profile.id),
          { access: 'public', contentType: 'video/mp4', addRandomSuffix: true },
        );
        const { photo, ...fields } = profile;
        const candidate = new Influencer({
          ...fields,
          email,
          phone: `+120255501${String(index).padStart(2, '0')}`,
          password: await bcrypt.hash(randomUUID(), 10),
          role: 'influencer',
          status: 'approved',
          isDemo: true,
          isVerified: false,
          certificateStatus: 'none',
          introVideoUrl: blob.url,
          avatar: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=600&q=80`,
          availability: normalizeAvailability({
            monday: [{ start: '09:00', end: '12:00' }],
            tuesday: [{ start: '14:00', end: '18:00' }],
            wednesday: [{ start: '10:00', end: '13:00' }],
            thursday: [{ start: '15:00', end: '19:00' }],
            friday: [{ start: '09:00', end: '12:00' }],
            saturday: [{ start: '10:00', end: '13:00' }],
            sunday: [],
          }),
          _version: 0,
        });
        await candidate.validate();
        const result = await Influencer.updateOne(
          { email },
          { $setOnInsert: candidate.toObject() },
          { upsert: true, runValidators: true },
        );
        added += result.upsertedCount;
        record = await Influencer.findOne({ email }).lean();
      }
      // Synchronize only these demo accounts to local storage; retain existing records.
      const local = JSON.parse(await fs.readFile(localPath, 'utf8'));
      if (
        !local.influencers.some((item) => {
          return item.id === record.id || item.email === record.email;
        })
      ) {
        const { _id, __v, ...fields } = record;
        local.influencers.push(fields);
        await fs.writeFile(localPath, `${JSON.stringify(local, null, 2)}\n`);
      }
      console.log(
        JSON.stringify({
          name: record.name,
          category: record.category,
          ready: Boolean(record.introVideoUrl) && record.status === 'approved',
        }),
      );
    }
    const verified = await Influencer.countDocuments({
      id: {
        $in: profiles.map((profile) => {
          return profile.id;
        }),
      },
      status: 'approved',
      introVideoUrl: { $regex: '^https://' },
    });
    if (verified !== profiles.length) {
      throw new Error('Demo account verification failed');
    }
    console.log(
      JSON.stringify({
        added,
        verified,
        totalInfluencers: await Influencer.countDocuments(),
      }),
    );
  } catch (error) {
    console.error('Demo influencer setup failed:', error.code || error.name);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
