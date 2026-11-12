const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== SmartPill Universal Build Runner ===');
console.log('Current working directory:', process.cwd());

// Determine where the frontend directory is located
let frontendDir = null;
let isInsideBackend = false;

if (fs.existsSync(path.join(process.cwd(), 'frontend', 'package.json'))) {
  frontendDir = path.join(process.cwd(), 'frontend');
  isInsideBackend = false;
} else if (fs.existsSync(path.join(process.cwd(), '..', 'frontend', 'package.json'))) {
  frontendDir = path.join(process.cwd(), '..', 'frontend');
  isInsideBackend = true;
} else {
  console.error('Error: Could not locate frontend directory from', process.cwd());
  process.exit(1);
}

console.log('Building frontend from:', frontendDir);

// 1. Ensure frontend dependencies are installed if needed
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
}

// 2. Build the frontend bundle
console.log('Running frontend build...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

// 3. If running inside backend/ (because Vercel Root Directory is set to backend),
// copy the built dist into backend/frontend/dist so Vercel's outputDirectory matches
if (isInsideBackend) {
  const targetDist = path.join(process.cwd(), 'frontend', 'dist');
  const sourceDist = path.join(frontendDir, 'dist');
  console.log(`Copying built assets from ${sourceDist} to ${targetDist}...`);
  fs.mkdirSync(targetDist, { recursive: true });
  fs.cpSync(sourceDist, targetDist, { recursive: true });
  console.log('Assets successfully copied to', targetDist);
}

console.log('=== Build completed successfully ===');
