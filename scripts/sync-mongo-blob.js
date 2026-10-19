import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function syncToAtlas() {
  if (!MONGODB_URI) {
    console.log('No MONGODB_URI found.');
    return;
  }

  try {
    console.log('🍃 Connecting to MongoDB Atlas to sync Vercel Blob URLs...');
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    const db = conn.connection.db;

    const dbPath = path.join(rootDir, 'backend/data/db.json');
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    // Sync Influencers in Atlas
    for (const inf of dbData.influencers || []) {
      await db.collection('influencers').updateOne(
        { email: inf.email },
        {
          $set: {
            avatar: inf.avatar,
            certification: inf.certification,
            specialization: inf.specialization,
            isVerified: inf.isVerified,
            status: inf.status,
          },
        },
        { upsert: true },
      );
      console.log(`   ✓ Synced Influencer: ${inf.name} -> ${inf.avatar}`);
    }

    // Sync Users in Atlas
    for (const u of dbData.users || []) {
      await db
        .collection('users')
        .updateOne(
          { email: u.email },
          { $set: { avatar: u.avatar, name: u.name, status: u.status } },
          { upsert: true },
        );
      console.log(`   ✓ Synced User: ${u.name} -> ${u.avatar}`);
    }

    console.log('✅ MongoDB Atlas synced with all Vercel Blob CDN URLs!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Atlas sync note:', err.message);
    process.exit(0);
  }
}

syncToAtlas();
