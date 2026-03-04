/**
 * main.js — Forus Electron Main Process Entry Point
 *
 * Responsibilities:
 *  - Create and manage the BrowserWindow (Forus UI)
 *  - Spawn the Engine child process for audio processing
 *  - Set up the system tray
 *  - Initialize IPC handlers bridging renderer ↔ engine
 *  - Handle app lifecycle events (ready, window-all-closed, activate)
 *  - Register the auto-updater
 *
 * Process: Main (Node.js + Electron APIs)
 * Architecture: Main ↔ Renderer via contextBridge / IPC
 *               Main ↔ Engine via child_process.fork / process.send
 */

'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');

const { setupTray } = require('./tray');
const { registerIpcHandlers } = require('./ipc-handlers');
const { initAutoUpdater } = require('./auto-updater');
const { createLogger } = require('../shared/logger');
const { IPC_CHANNELS, ENGINE_MESSAGES } = require('../shared/constants');

/** @type {BrowserWindow|null} The main application window */
let mainWindow = null;

/** @type {import('child_process').ChildProcess|null} The engine child process */
let engineProcess = null;

const log = createLogger('main');

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW CREATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates the main BrowserWindow with Forus configuration.
 * Loads the renderer's index.html.
 *
 * @returns {BrowserWindow} The created browser window instance.
 */
function createMainWindow() {
  log.info('Creating main window');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    backgroundColor: '#0d0d0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready-to-show to avoid flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // Security: isolate renderer from Node
      nodeIntegration: false,    // Security: no Node in renderer
      sandbox: false,            // Needed for preload to access Node APIs
      webSecurity: true,
    },
  });

  // Load the renderer HTML
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Show window gracefully once ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Main window shown');
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    log.info('Main window closed');
    mainWindow = null;
  });

  return mainWindow;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE CHILD PROCESS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Spawns the audio engine as a forked Node.js child process.
 * The engine handles WebRTC, codec encoding/decoding, and DSP.
 * Communication uses process.send() / process.on('message').
 *
 * @returns {import('child_process').ChildProcess} The spawned engine process.
 */
function spawnEngine() {
  log.info('Spawning engine process');

  const enginePath = path.join(__dirname, '../engine/engine.js');

  engineProcess = fork(enginePath, [], {
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'production',
    },
    // Engine runs as a separate process — serialize via JSON messages
    serialization: 'json',
  });

  // ── Engine → Main messages ──────────────────────────────────────────────
  engineProcess.on('message', (message) => {
    log.debug('Message from engine:', message);

    if (!mainWindow || mainWindow.isDestroyed()) return;

    const { type, payload } = message;

    // Forward engine messages to the renderer via IPC
    switch (type) {
      case ENGINE_MESSAGES.AUDIO_STATS:
        mainWindow.webContents.send(IPC_CHANNELS.ENGINE_AUDIO_STATS, payload);
        break;
      case ENGINE_MESSAGES.VOICE_STATE_CHANGED:
        mainWindow.webContents.send(IPC_CHANNELS.ENGINE_VOICE_STATE, payload);
        break;
      case ENGINE_MESSAGES.CODEC_CHANGED:
        mainWindow.webContents.send(IPC_CHANNELS.ENGINE_CODEC_CHANGED, payload);
        break;
      case ENGINE_MESSAGES.RECORDING_STARTED:
        mainWindow.webContents.send(IPC_CHANNELS.ENGINE_RECORDING_STARTED, payload);
        break;
      case ENGINE_MESSAGES.RECORDING_STOPPED:
        mainWindow.webContents.send(IPC_CHANNELS.ENGINE_RECORDING_STOPPED, payload);
        break;
      case ENGINE_MESSAGES.ERROR:
        log.error('Engine error:', payload);
        mainWindow.webContents.send(IPC_CHANNELS.ENGINE_ERROR, payload);
        break;
      default:
        log.warn('Unknown message type from engine:', type);
    }
  });

  engineProcess.on('error', (err) => {
    log.error('Engine process error:', err.message);
  });

  engineProcess.on('exit', (code, signal) => {
    log.warn(`Engine process exited — code: ${code}, signal: ${signal}`);
    engineProcess = null;

    // Restart engine after a short delay if app is still running.
    // Note: IPC handlers are NOT re-registered here because they already
    // reference `sendToEngine`, which itself reads the module-scoped
    // `engineProcess` variable. After spawnEngine() updates that variable,
    // all existing handlers automatically route to the new process.
    if (!app.isQuitting) {
      setTimeout(() => {
        log.info('Restarting engine process...');
        spawnEngine();
      }, 2000);
    }
  });

  log.info('Engine process spawned, PID:', engineProcess.pid);
  return engineProcess;
}

/**
 * Sends a message to the engine process safely.
 * Exported so IPC handlers can use it.
 *
 * @param {string} type - The message type (use ENGINE_MESSAGES constants).
 * @param {object} payload - The message payload.
 */
function sendToEngine(type, payload = {}) {
  if (!engineProcess || engineProcess.killed) {
    log.warn('Engine not running — cannot send message:', type);
    return;
  }
  engineProcess.send({ type, payload });
}

// ─────────────────────────────────────────────────────────────────────────────
// APP LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * app.whenReady — runs once Electron is initialized and ready to create windows.
 */
app.whenReady().then(() => {
  log.info(`Forus starting — Electron ${process.versions.electron}, Node ${process.versions.node}`);

  // Spawn engine before creating window so it's ready when UI loads
  spawnEngine();

  // Create the main window
  createMainWindow();

  // Set up system tray
  setupTray(mainWindow);

  // Register all IPC handlers (bridge between renderer and engine)
  registerIpcHandlers(mainWindow, engineProcess, sendToEngine);

  // Initialize auto-updater (checks for updates in the background)
  initAutoUpdater(mainWindow);

  // macOS: re-create window if app is activated and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

/**
 * Quit app when all windows are closed, except on macOS.
 * On macOS, apps conventionally stay in the dock even without windows.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Clean shutdown — kill engine process before quitting.
 */
app.on('before-quit', () => {
  log.info('App quitting — shutting down engine...');
  app.isQuitting = true;

  if (engineProcess && !engineProcess.killed) {
    engineProcess.send({ type: ENGINE_MESSAGES.SHUTDOWN });
    // Give engine 2 seconds to clean up, then force kill
    setTimeout(() => {
      if (engineProcess && !engineProcess.killed) {
        log.warn('Engine did not shut down gracefully — forcing kill');
        engineProcess.kill('SIGKILL');
      }
    }, 2000);
  }
});

/**
 * Export sendToEngine for use by IPC handler modules.
 * @type {Function}
 */
module.exports = { sendToEngine };
