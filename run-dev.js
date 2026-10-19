import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\x1b[33m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '⚡ VELOCE / SWIFTCAB Full-Stack Development Server');
console.log('\x1b[32m%s\x1b[0m', '🚗 Starting Backend API Server (Port 5000)...');
console.log('\x1b[34m%s\x1b[0m', '💻 Starting Frontend Vite Server (Port 3000)...');
console.log('\x1b[33m%s\x1b[0m', '==================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Backend API Server
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
});

// 2. Start Frontend Vite Dev Server
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

backend.on('error', (err) => {
  console.error('\x1b[31mBackend Error:\x1b[0m', err.message);
});

frontend.on('error', (err) => {
  console.error('\x1b[31mFrontend Error:\x1b[0m', err.message);
});

const cleanup = () => {
  console.log('\n\x1b[33mShutting down servers...\x1b[0m');
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
