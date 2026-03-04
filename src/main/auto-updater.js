/**
 * auto-updater.js — Forus Auto-Updater Integration
 *
 * Uses electron-updater (from electron-builder) to check for app updates
 * and notify the user. Updates are downloaded in the background and installed
 * on next relaunch.
 *
 * The update server URL should be set in electron-builder.yml under:
 *   publish:
 *     provider: github  # or s3, generic, etc.
 *
 * Update flow:
 *   1. App launches → check for update
 *   2. Update found → download silently in background
 *   3. Download complete → notify user via IPC to renderer
 *   4. User confirms → quitAndInstall()
 *
 * Process: Main
 */

'use strict';

const { autoUpdater } = require('electron-updater');
const { createLogger } = require('../shared/logger');
const { IPC_CHANNELS } = require('../shared/constants');

const log = createLogger('auto-updater');

/** How often to check for updates (ms). Default: every 4 hours. */
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000;

/** @type {NodeJS.Timeout|null} Interval handle for periodic update checks */
let updateInterval = null;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initializes the auto-updater with the main window reference.
 * Registers event handlers and kicks off the first update check.
 *
 * @param {import('electron').BrowserWindow} mainWindow - Used to send IPC to renderer.
 */
function initAutoUpdater(mainWindow) {
  log.info('Initializing auto-updater');

  // Don't run updater in development (no packaged app to update)
  if (process.env.NODE_ENV === 'development') {
    log.info('Development mode — auto-updater disabled');
    return;
  }

  // Configure updater
  autoUpdater.autoDownload = true;          // Download update silently
  autoUpdater.autoInstallOnAppQuit = true;  // Install when app quits
  autoUpdater.allowDowngrade = false;

  // ── Event handlers ─────────────────────────────────────────────────────────

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    sendToRenderer(mainWindow, IPC_CHANNELS.UPDATER_CHECKING);
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    sendToRenderer(mainWindow, IPC_CHANNELS.UPDATER_AVAILABLE, {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('No update available. Current version is latest:', info.version);
    sendToRenderer(mainWindow, IPC_CHANNELS.UPDATER_UP_TO_DATE, { version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    log.debug('Download progress:', `${Math.round(progress.percent)}%`);
    sendToRenderer(mainWindow, IPC_CHANNELS.UPDATER_DOWNLOAD_PROGRESS, {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    sendToRenderer(mainWindow, IPC_CHANNELS.UPDATER_DOWNLOADED, {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
    // Auto-install is handled by autoInstallOnAppQuit = true
    // But we also notify the renderer so it can show a "Restart to Update" prompt
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err.message);
    sendToRenderer(mainWindow, IPC_CHANNELS.UPDATER_ERROR, { message: err.message });
  });

  // ── Initial check + periodic checks ───────────────────────────────────────

  // Check immediately on startup (with a small delay to let app settle)
  setTimeout(() => {
    checkForUpdates();
  }, 5000);

  // Check periodically
  updateInterval = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);

  log.info('Auto-updater initialized');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggers an update check. Catches errors so they don't crash the app.
 */
function checkForUpdates() {
  log.info('Triggering update check');
  autoUpdater.checkForUpdates().catch((err) => {
    log.error('Update check failed:', err.message);
  });
}

/**
 * Sends an IPC message to the renderer if the window is available.
 *
 * @param {import('electron').BrowserWindow} mainWindow
 * @param {string} channel - The IPC channel name.
 * @param {object} [payload] - Optional payload.
 */
function sendToRenderer(mainWindow, channel, payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, payload);
}

/**
 * Immediately quit and install the downloaded update.
 * Call this when the user confirms the "Restart to Update" prompt.
 */
function applyUpdate() {
  log.info('Applying update and restarting...');
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  autoUpdater.quitAndInstall(false, true);
}

module.exports = { initAutoUpdater, checkForUpdates, applyUpdate };
