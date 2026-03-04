/**
 * scripts/dev.js — Forus Development Server Helper
 *
 * Usage: npm run dev
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║              FORUS  —  Development Mode              ║');
console.log('║         High-Fidelity Voice for Audiophiles          ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
console.log('  Starting Electron with NODE_ENV=development...');
console.log('  DevTools will open automatically in a detached window.');
console.log('  Press Ctrl+C to stop.');
console.log('');

function getElectronBin() {
  const electronDir = path.dirname(require.resolve('electron'));
  const pathFile = path.join(electronDir, 'path.txt');

  try {
    const electronExe = require('fs').readFileSync(pathFile, 'utf8').trim();
    return path.join(electronDir, 'dist', electronExe);
  } catch {
    const binSuffix = process.platform === 'win32' ? '.cmd' : '';
    return path.join(__dirname, '..', 'node_modules', '.bin', `electron${binSuffix}`);
  }
}

const projectRoot = path.join(__dirname, '..');
const electronBin = getElectronBin();

const devEnv = {
  ...process.env,
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug',
  ELECTRON_IS_DEV: '1',
};

console.log('  Electron binary:', electronBin);
console.log('  Project root:', projectRoot);
console.log('');

const electronProcess = spawn(electronBin, ['.'], {
  cwd: projectRoot,
  env: devEnv,
  stdio: 'inherit',
});

electronProcess.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n  Electron exited due to signal: ${signal}`);
  } else if (code !== 0) {
    console.log(`\n  Electron exited with code: ${code}`);
    process.exit(code);
  } else {
    console.log('\n  Electron exited cleanly.');
    process.exit(0);
  }
});

electronProcess.on('error', (err) => {
  console.error('\n  Failed to start Electron:', err.message);
  console.error('  Make sure you ran "npm install" first.');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n  Caught SIGINT — shutting down...');
  electronProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n  Caught SIGTERM — shutting down...');
  electronProcess.kill('SIGTERM');
});
