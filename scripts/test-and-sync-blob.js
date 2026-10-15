import { put, list } from '@vercel/blob';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Load environment variables from backend/.env and root .env
dotenv.config({ path: path.join(rootDir, 'backend/.env') });
dotenv.config({ path: path.join(rootDir, '.env') });

const token = process.env.BLOB_READ_WRITE_TOKEN;

async function checkAndSync() {
  console.log('🔍 Checking Vercel Blob Storage connection...');
  console.log('   Token Status:', token ? `Configured (${token.slice(0, 18)}...)` : '❌ NOT CONFIGURED');

  if (!token) {
    console.error('\n❌ BLOB_READ_WRITE_TOKEN is missing in your local backend/.env!');
    console.log('\n👉 HOW TO GET YOUR TOKEN FROM VERCEL:');
    console.log('   1. Go to your Vercel Dashboard -> Storage -> click "meetfame-blob".');
    console.log('   2. Click the ".env.local" or "Quickstart" tab.');
    console.log('   3. Copy the value of BLOB_READ_WRITE_TOKEN (starts with "vercel_blob_rw_...").');
    console.log('   4. Paste it into backend/.env:');
    console.log('      BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx');
    console.log('   5. Then run: node scripts/test-and-sync-blob.js\n');
    process.exit(1);
  }

  try {
    // 1. Test live read connection to Vercel Blob
    console.log('\n📡 Testing connection to Vercel Blob CDN...');
    const existingBlobs = await list({ token });
    console.log(`✅ Connected successfully to Vercel Blob! Found ${existingBlobs.blobs.length} existing blobs in store.`);

    // 2. Prepare local static assets to upload to Vercel Blob
    console.log('\n📦 Uploading local static assets to Vercel Blob Storage...');

    const assetsToUpload = [
      {
        pathname: 'meetfame/assets/logo.svg',
        filePath: path.join(rootDir, 'frontend/public/logo.svg'),
        contentType: 'image/svg+xml'
      },
      {
        pathname: 'meetfame/certificates/sample_cert.pdf',
        filePath: path.join(rootDir, 'backend/data/uploads/sample_cert.pdf'),
        contentType: 'application/pdf'
      }
    ];

    const uploadedUrls = {};

    for (const asset of assetsToUpload) {
      if (fs.existsSync(asset.filePath)) {
        const buffer = fs.readFileSync(asset.filePath);
        console.log(`   Uploading: ${asset.pathname}...`);
        const blob = await put(asset.pathname, buffer, {
          access: 'public',
          token,
          contentType: asset.contentType
        });
        console.log(`   ✓ Uploaded: ${blob.url}`);
        uploadedUrls[asset.pathname] = blob.url;
      }
    }

    // 3. Upload High-Res Creator Avatars to Vercel Blob
    console.log('\n📸 Uploading creator and user avatars to Vercel Blob...');
    const avatarSeeds = [
      {
        name: 'marcus-vance.jpg',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        influencerId: 'inf_1'
      },
      {
        name: 'sophia-reyes.jpg',
        url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        influencerId: 'inf_2'
      },
      {
        name: 'jordan-sterling.jpg',
        url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        influencerId: 'inf_3'
      },
      {
        name: 'kavita-patel.jpg',
        url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        influencerId: 'inf_4'
      },
      {
        name: 'alex-rivera.jpg',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        userId: 'usr_1'
      },
      {
        name: 'david-chen.jpg',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        userId: 'usr_2'
      }
    ];

    const avatarMap = {};
    for (const item of avatarSeeds) {
      try {
        console.log(`   Fetching and uploading avatar: ${item.name}...`);
        const res = await fetch(item.url);
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        const blob = await put(`meetfame/avatars/${item.name}`, buffer, {
          access: 'public',
          token,
          contentType: 'image/jpeg'
        });

        console.log(`   ✓ Live Blob URL: ${blob.url}`);
        if (item.influencerId) avatarMap[item.influencerId] = blob.url;
        if (item.userId) avatarMap[item.userId] = blob.url;
      } catch (e) {
        console.warn(`   ⚠️ Could not upload avatar ${item.name}:`, e.message);
      }
    }

    // 4. Update db.json with the Vercel Blob URLs
    const dbPath = path.join(rootDir, 'backend/data/db.json');
    if (fs.existsSync(dbPath)) {
      console.log('\n🔄 Updating local database to use Vercel Blob URLs...');
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

      // Update Influencers
      if (dbData.influencers) {
        dbData.influencers = dbData.influencers.map(inf => {
          const blobAvatar = avatarMap[inf.id];
          const blobCert = uploadedUrls['meetfame/certificates/sample_cert.pdf'];
          return {
            ...inf,
            avatar: blobAvatar || inf.avatar,
            certification: inf.certification ? {
              ...inf.certification,
              fileUrl: blobCert || inf.certification.fileUrl
            } : null
          };
        });
      }

      // Update Users
      if (dbData.users) {
        dbData.users = dbData.users.map(u => ({
          ...u,
          avatar: avatarMap[u.id] || u.avatar
        }));
      }

      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
      console.log('✅ Local database records now fetch directly from Vercel Blob Storage!');
    }

    console.log('\n🎉 All static images & certificates are now hosted on and fetched from Vercel Blob!');
  } catch (err) {
    console.error('\n❌ Error interacting with Vercel Blob:', err.message);
  }
}

checkAndSync();
