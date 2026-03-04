/**
 * ipc-handlers.js — Forus IPC Bridge
 *
 * Registers all ipcMain handlers for communication between:
 *  - Renderer → Main (via ipcRenderer.invoke in preload)
 *  - Main → Engine (via process.send on the engine child process)
 *  - Engine → Main → Renderer (forwarded in main.js engine message handler)
 *
 * Each handler validates input, forwards to the engine if applicable,
 * and returns a standardized response: { ok: boolean, data?, error? }
 *
 * Process: Main
 */

'use strict';

const { ipcMain, app } = require('electron');
const { IPC_CHANNELS, ENGINE_MESSAGES } = require('../shared/constants');
const { createLogger } = require('../shared/logger');

const log = createLogger('ipc-handlers');

/**
 * Standardized success response.
 * @param {*} data
 * @returns {{ ok: true, data: * }}
 */
function ok(data = null) {
  return { ok: true, data };
}

/**
 * Standardized error response.
 * @param {string} message
 * @param {*} [details]
 * @returns {{ ok: false, error: string, details?: * }}
 */
function err(message, details) {
  return { ok: false, error: message, details };
}

/**
 * Registers all IPC handlers.
 * Call this once after the main window and engine process are created.
 *
 * @param {import('electron').BrowserWindow} mainWindow - The main browser window.
 * @param {import('child_process').ChildProcess} engineProcess - The engine child process reference.
 * @param {function} sendToEngine - Helper to send messages to the engine.
 */
function registerIpcHandlers(mainWindow, engineProcess, sendToEngine) {
  log.info('Registering IPC handlers');

  // ── Voice Connection ─────────────────────────────────────────────────────

  /**
   * Connect to a voice channel.
   * Forwards to engine with connection parameters.
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_VOICE_CONNECT, async (_event, { channelId, serverUrl }) => {
    log.info('voice-connect requested:', channelId, serverUrl);
    try {
      sendToEngine(ENGINE_MESSAGES.VOICE_CONNECT, { channelId, serverUrl });
      return ok({ channelId, status: 'connecting' });
    } catch (e) {
      log.error('voice-connect error:', e.message);
      return err('Failed to initiate voice connection', e.message);
    }
  });

  /**
   * Disconnect from the current voice channel.
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_VOICE_DISCONNECT, async (_event) => {
    log.info('voice-disconnect requested');
    try {
      sendToEngine(ENGINE_MESSAGES.VOICE_DISCONNECT);
      return ok({ status: 'disconnected' });
    } catch (e) {
      log.error('voice-disconnect error:', e.message);
      return err('Failed to disconnect', e.message);
    }
  });

  // ── Codec Control ────────────────────────────────────────────────────────

  /**
   * Set the audio codec and encoding parameters.
   * @param {string} codec - 'flac' | 'alac' | 'opus' | 'aac'
   * @param {object} options - { bitrate?, sampleRate?, bitDepth? }
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_SET_CODEC, async (_event, { codec, options }) => {
    log.info('set-codec requested:', codec, options);
    const validCodecs = ['flac', 'alac', 'opus', 'aac'];
    if (!validCodecs.includes(codec)) {
      return err(`Invalid codec "${codec}". Must be one of: ${validCodecs.join(', ')}`);
    }
    try {
      sendToEngine(ENGINE_MESSAGES.SET_CODEC, { codec, options });
      return ok({ codec });
    } catch (e) {
      return err('Failed to set codec', e.message);
    }
  });

  // ── DSP / EQ ─────────────────────────────────────────────────────────────

  /**
   * Configure the parametric EQ for a user's channel strip.
   * @param {string} userId
   * @param {string} band - 'low' | 'mid' | 'high'
   * @param {number} gain - dB value
   * @param {number} freq - Hz
   * @param {number} Q - Q factor
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_SET_EQ, async (_event, { userId, band, gain, freq, Q }) => {
    log.debug('set-eq:', userId, band, gain, freq, Q);
    try {
      sendToEngine(ENGINE_MESSAGES.SET_EQ, { userId, band, gain, freq, Q });
      return ok({ userId, band });
    } catch (e) {
      return err('Failed to set EQ', e.message);
    }
  });

  // ── Mute / Deafen ────────────────────────────────────────────────────────

  /**
   * Toggle microphone mute state.
   * @param {boolean} muted
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_TOGGLE_MUTE, async (_event, { muted }) => {
    log.info('toggle-mute:', muted);
    try {
      sendToEngine(ENGINE_MESSAGES.SET_MUTE, { muted });
      return ok({ muted });
    } catch (e) {
      return err('Failed to toggle mute', e.message);
    }
  });

  /**
   * Toggle deafen state (mutes all incoming audio).
   * @param {boolean} deafened
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_TOGGLE_DEAFEN, async (_event, { deafened }) => {
    log.info('toggle-deafen:', deafened);
    try {
      sendToEngine(ENGINE_MESSAGES.SET_DEAFEN, { deafened });
      return ok({ deafened });
    } catch (e) {
      return err('Failed to toggle deafen', e.message);
    }
  });

  // ── Recording ────────────────────────────────────────────────────────────

  /**
   * Start recording the mix-down.
   * @param {string} format - 'flac' | 'wav'
   * @param {string} [filePath] - Optional output path
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_START_RECORDING, async (_event, { format, filePath }) => {
    log.info('start-recording:', format, filePath);
    const validFormats = ['flac', 'wav'];
    if (!validFormats.includes(format)) {
      return err(`Invalid format "${format}". Must be 'flac' or 'wav'`);
    }
    try {
      // Default recording path if none provided
      const outputPath = filePath || require('path').join(
        app.getPath('documents'),
        'Forus Recordings',
        `forus-recording-${Date.now()}.${format}`
      );
      sendToEngine(ENGINE_MESSAGES.START_RECORDING, { format, filePath: outputPath });
      return ok({ format, filePath: outputPath, status: 'recording' });
    } catch (e) {
      return err('Failed to start recording', e.message);
    }
  });

  /**
   * Stop the current recording and finalize the file.
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_STOP_RECORDING, async (_event) => {
    log.info('stop-recording requested');
    try {
      sendToEngine(ENGINE_MESSAGES.STOP_RECORDING);
      return ok({ status: 'stopped' });
    } catch (e) {
      return err('Failed to stop recording', e.message);
    }
  });

  // ── Mixer ────────────────────────────────────────────────────────────────

  /**
   * Update mixer settings for a user's channel strip.
   * @param {object} update - { userId, volume, pan, solo, mute }
   */
  ipcMain.handle(IPC_CHANNELS.ENGINE_MIXER_UPDATE, async (_event, update) => {
    log.debug('mixer-update:', update);
    try {
      sendToEngine(ENGINE_MESSAGES.MIXER_UPDATE, update);
      return ok(update);
    } catch (e) {
      return err('Failed to update mixer', e.message);
    }
  });

  // ── App-level handlers ───────────────────────────────────────────────────

  /**
   * Return the list of available audio input/output devices.
   * Uses the Electron media API (requires user permission in some cases).
   */
  ipcMain.handle(IPC_CHANNELS.APP_GET_AUDIO_DEVICES, async (_event) => {
    log.info('get-audio-devices requested');
    try {
      // In a real implementation, use navigator.mediaDevices.enumerateDevices()
      // from the renderer. Here we return placeholder data.
      const devices = {
        inputs: [
          { deviceId: 'default', label: 'Default Microphone', kind: 'audioinput' },
          { deviceId: 'builtin', label: 'Built-in Microphone', kind: 'audioinput' },
        ],
        outputs: [
          { deviceId: 'default', label: 'Default Output', kind: 'audiooutput' },
          { deviceId: 'headphones', label: 'Headphones', kind: 'audiooutput' },
        ],
      };
      return ok(devices);
    } catch (e) {
      return err('Failed to enumerate audio devices', e.message);
    }
  });

  /**
   * Return the current application version.
   */
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, async (_event) => {
    return ok(app.getVersion());
  });

  log.info('IPC handlers registered');
}

module.exports = { registerIpcHandlers };
