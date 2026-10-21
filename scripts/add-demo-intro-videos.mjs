import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { put } from '@vercel/blob';
import { parseBuffer } from 'music-metadata';

const root = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(root, 'backend/.env'), quiet: true });
const directory = process.argv[2];
if (!directory || !process.env.MONGODB_URI || !process.env.BLOB_READ_WRITE_TOKEN)
  throw new Error('Provide a video directory and configure MongoDB and Blob storage.');
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
const localPath = path.join(root, 'backend/data/db.json');
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const collection = mongoose.connection.db.collection('influencers');
  const missing = { $or: [{ introVideoUrl: { $exists: false } }, { introVideoUrl: '' }, { introVideoUrl: null }] };
  let updated = 0;
  for await (const record of collection.find(missing, { projection: { name: 1 } })) {
    const source = manifest.influencers.find((item) => item.name === record.name);
    if (!source || !/^[a-z0-9_-]+$/i.test(source.id)) throw new Error('Missing demo video in manifest.');
    const buffer = await fs.readFile(path.join(directory, `${source.id}.mp4`));
    const metadata = await parseBuffer(buffer, { mimeType: 'video/mp4' });
    const duration = metadata.format.containerDuration || metadata.format.duration;
    if (!metadata.format.hasVideo || !Number.isFinite(duration) || duration <= 0 || duration > 15 || buffer.length > 5 * 1024 * 1024)
      throw new Error('Demo video does not meet video limits.');
    const blob = await put(`meetfame/intro-demo-${source.id}.mp4`, buffer, { access: 'public', contentType: 'video/mp4', addRandomSuffix: true });
    const result = await collection.updateOne({ _id: record._id, ...missing }, { $set: { introVideoUrl: blob.url }, $inc: { _version: 1 } });
    if (!result.modifiedCount) continue;
    // Read again so unrelated local edits are preserved.
    const local = JSON.parse(await fs.readFile(localPath, 'utf8'));
    for (const person of local.influencers)
      if (person.name === record.name && !person.introVideoUrl) person.introVideoUrl = blob.url;
    await fs.writeFile(localPath, `${JSON.stringify(local, null, 2)}\n`);
    const response = await fetch(blob.url, { headers: { Range: 'bytes=0-31' } });
    if (![200, 206].includes(response.status)) throw new Error('Uploaded demo video is not reachable.');
    await response.body?.cancel();
    console.log(JSON.stringify({ name: record.name, seconds: duration, bytes: buffer.length, verified: true }));
    updated++;
  }
  console.log(JSON.stringify({ updated, remainingWithoutVideo: await collection.countDocuments(missing) }));
} catch (error) {
  console.error('Demo video backfill failed:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
