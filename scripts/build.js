import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function run(cmd, cwd = rootDir) {
  console.log(`\n▶ [Build] Executing: ${cmd} (in ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('🚀 Starting MeetFame Unified Single-Project Build for Vercel...');

  // 1. Build Frontend
  console.log('📦 Building frontend (Public Landing, User Portal & Influencer Dashboard)...');
  run('npm --prefix frontend install');
  run('npm --prefix frontend run build');

  // 2. Build Web Panel
  console.log('📦 Building web-panel (Admin Command Center under /admin)...');
  run('npm --prefix web-panel install');
  run('npm --prefix web-panel run build');

  // 3. Assemble Unified Dist Directory
  console.log('📦 Packaging unified output to root dist/...');
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy frontend to dist/
  const frontendDist = path.join(rootDir, 'frontend', 'dist');
  copyDirRecursive(frontendDist, distDir);

  // Copy web-panel to dist/admin/
  const webPanelDist = path.join(rootDir, 'web-panel', 'dist');
  const adminDist = path.join(distDir, 'admin');
  copyDirRecursive(webPanelDist, adminDist);

  console.log('\n✅ MeetFame Single-Project Build Complete!');
  console.log('   - Frontend (Root): dist/index.html');
  console.log('   - Admin Panel (/admin): dist/admin/index.html');
  console.log('   - API Routes (/api/*): api/index.js');
} catch (err) {
  console.error('\n❌ Build failed:', err.message);
  process.exit(1);
}
