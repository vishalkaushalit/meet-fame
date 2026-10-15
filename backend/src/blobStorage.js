import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../data/uploads');

/**
 * Upload image / file to Vercel Blob Storage
 * Falls back to local storage if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function uploadToStorage(file, filenamePrefix = 'upload') {
  if (!file) return null;

  const originalName = file.originalname || 'file.bin';
  const ext = path.extname(originalName);
  const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '');
  const pathname = `meetfame/${filenamePrefix}-${cleanBase}-${Date.now()}${ext}`;

  // If Vercel Blob Token is set, upload directly to Vercel Blob CDN
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log(`[Vercel Blob] Uploading ${pathname} to Vercel Blob Storage...`);
      const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!buffer) {
        throw new Error('No file buffer available for Vercel Blob upload');
      }

      const blob = await put(pathname, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      console.log(`[Vercel Blob] Upload successful! URL:`, blob.url);
      return blob.url;
    } catch (err) {
      console.error('[Vercel Blob] Error uploading to Vercel Blob, falling back to local storage:', err.message);
    }
  }

  // Local storage fallback (saved in data/uploads)
  if (file.filename) {
    return `/uploads/${file.filename}`;
  } else if (file.buffer) {
    const filename = `${filenamePrefix}-${Date.now()}${ext}`;
    const targetPath = path.join(uploadDir, filename);
    fs.writeFileSync(targetPath, file.buffer);
    return `/uploads/${filename}`;
  }

  return `/uploads/sample_cert.pdf`;
}
