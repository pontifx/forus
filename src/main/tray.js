/**
 * tray.js — Forus System Tray
 *
 * Creates the system tray icon with a context menu for quick access
 * to common Forus actions (Show/Hide, Mute, Deafen, Quit).
 *
 * On macOS the tray icon appears in the menu bar.
 * On Windows/Linux it appears in the system notification area.
 *
 * Process: Main
 */

'use strict';

const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const { createLogger } = require('../shared/logger');
const { IPC_CHANNELS } = require('../shared/constants');

const log = createLogger('tray');

/** @type {Tray|null} The system tray instance */
let tray = null;

/** @type {boolean} Current mute state (tracks UI state) */
let isMuted = false;

/** @type {boolean} Current deafen state */
let isDeafened = false;

// ─────────────────────────────────────────────────────────────────────────────
// TRAY SETUP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates and configures the system tray.
 *
 * @param {import('electron').BrowserWindow} mainWindow - The main app window.
 * @returns {Tray} The created Tray instance.
 */
function setupTray(mainWindow) {
  log.info('Setting up system tray');

  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');

  // Load the tray icon; fall back to a blank image if missing
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      log.warn('Tray icon is empty — using fallback');
      icon = createFallbackIcon();
    }
  } catch (e) {
    log.warn('Could not load tray icon:', e.message);
    icon = createFallbackIcon();
  }

  // Resize for retina / high-DPI on macOS
  if (process.platform === 'darwin') {
    icon = icon.resize({ width: 16, height: 16 });
    icon.setTemplateImage(true); // Makes it adapt to dark/light menu bar
  }

  tray = new Tray(icon);
  tray.setToolTip('Forus — High-Fidelity Voice');

  // Build initial context menu
  updateContextMenu(mainWindow);

  // Click to show/hide window on Windows/Linux (macOS shows menu on click)
  if (process.platform !== 'darwin') {
    tray.on('click', () => {
      toggleWindow(mainWindow);
    });
  }

  log.info('System tray created');
  return tray;
}

/**
 * Builds and sets the tray context menu.
 * Called initially and whenever state changes (mute/deafen).
 *
 * @param {import('electron').BrowserWindow} mainWindow
 */
function updateContextMenu(mainWindow) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Forus',
      enabled: false,
      // Static header label
    },
    { type: 'separator' },
    {
      label: mainWindow && mainWindow.isVisible() ? 'Hide Window' : 'Show Window',
      click: () => toggleWindow(mainWindow),
      accelerator: process.platform === 'darwin' ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
    },
    { type: 'separator' },
    {
      label: isMuted ? 'Unmute Microphone' : 'Mute Microphone',
      type: 'checkbox',
      checked: isMuted,
      click: (menuItem) => {
        isMuted = menuItem.checked;
        log.info('Tray mute toggled:', isMuted);
        // Forward to renderer if window exists
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_CHANNELS.TRAY_MUTE_TOGGLED, { muted: isMuted });
        }
        updateContextMenu(mainWindow);
      },
    },
    {
      label: isDeafened ? 'Undeafen' : 'Deafen',
      type: 'checkbox',
      checked: isDeafened,
      click: (menuItem) => {
        isDeafened = menuItem.checked;
        log.info('Tray deafen toggled:', isDeafened);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_CHANNELS.TRAY_DEAFEN_TOGGLED, { deafened: isDeafened });
        }
        updateContextMenu(mainWindow);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Forus',
      click: () => {
        log.info('Quit requested from tray');
        app.quit();
      },
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
    },
  ]);

  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(contextMenu);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggles the main window visibility.
 *
 * @param {import('electron').BrowserWindow} mainWindow
 */
function toggleWindow(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    log.debug('Window hidden via tray');
  } else {
    mainWindow.show();
    mainWindow.focus();
    log.debug('Window shown via tray');
  }

  updateContextMenu(mainWindow);
}

/**
 * Creates a minimal 16x16 fallback tray icon using raw RGBA data.
 * Used when the icon PNG is not available.
 *
 * @returns {import('electron').NativeImage}
 */
function createFallbackIcon() {
  // 16x16 solid teal square as a minimal placeholder
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4); // RGBA
  for (let i = 0; i < size * size; i++) {
    buffer[i * 4 + 0] = 0x3b; // R (teal)
    buffer[i * 4 + 1] = 0x9e; // G
    buffer[i * 4 + 2] = 0xa5; // B
    buffer[i * 4 + 3] = 0xff; // A (fully opaque)
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

/**
 * Update the tray mute/deafen state from external sources (e.g., renderer UI).
 *
 * @param {{ muted?: boolean, deafened?: boolean }} state
 * @param {import('electron').BrowserWindow} mainWindow
 */
function updateTrayState(state, mainWindow) {
  let changed = false;
  if (typeof state.muted === 'boolean' && state.muted !== isMuted) {
    isMuted = state.muted;
    changed = true;
  }
  if (typeof state.deafened === 'boolean' && state.deafened !== isDeafened) {
    isDeafened = state.deafened;
    changed = true;
  }
  if (changed) {
    updateContextMenu(mainWindow);
  }
}

module.exports = { setupTray, updateTrayState };
