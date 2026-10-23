import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(
  new URL('../backend/package.json', import.meta.url),
);
require('dotenv').config({
  path: new URL('../backend/.env', import.meta.url).pathname,
});
const { copy, head, del } = require('@vercel/blob');
const mongoose = require('mongoose');
const { mongoConnection } = await import('../backend/src/mongoConnection.js');
const localPath = new URL('../backend/data/db.json', import.meta.url);
const local = JSON.parse(await fs.readFile(localPath, 'utf8'));
const moved = new Map();
let count = 0;
try {
  await mongoConnection.connect();
  const collection = mongoose.connection.db.collection('influencers');
  const profiles = await collection.find({ introVideoUrl: { $type: 'string' } }).toArray();
  const urls = new Set(
    [...profiles, ...(local.influencers || [])].map((item) => {
        return item.introVideoUrl;
      }).filter(Boolean),
  );
  for (const url of urls) {
    const parsed = new URL(url, 'http://local');
    if (
      !parsed.hostname.endsWith('.public.blob.vercel-storage.com') ||
      !parsed.pathname.startsWith('/meetfame/intro-')
    ) {
      continue;
    }
    const target = `introduction_video/${parsed.pathname.split('/').pop()}`;
    const original = await head(url);
    const next = await copy(url, target, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    const verified = await head(next.url);
    if (verified.size !== original.size) {
      throw new Error('Copied video size did not match.');
    }
    moved.set(url, next.url);
    await collection.updateMany(
      { introVideoUrl: url },
      { $set: { introVideoUrl: next.url }, $inc: { _version: 1 } },
    );
    for (const profile of local.influencers || []) {
      if (profile.introVideoUrl === url) {
        profile.introVideoUrl = next.url;
      }
    }
    count++;
  }
  const tempPath = new URL('../backend/data/db.json.tmp', import.meta.url);
  await fs.writeFile(tempPath, JSON.stringify(local, null, 2));
  await fs.rename(tempPath, localPath);
  for (const oldUrl of moved.keys()) {
    if (await collection.countDocuments({ introVideoUrl: oldUrl })) {
      throw new Error('Old video still referenced; deletion skipped.');
    }
    await del(oldUrl);
  }
  console.log(
    `Moved and verified ${count} introduction videos; old copies deleted.`,
  );
} finally {
  await mongoose.disconnect();
}
