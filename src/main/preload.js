/**
 * preload.js — Forus Electron Preload Script
 *
 * Runs in the renderer's context but with access to Node.js APIs.
 * Uses Electron's contextBridge to expose a safe, curated API
 * (forusAPI) to the renderer — without exposing full Node or
 * Electron internals.
 *
 * Security principles:
 *  - contextIsolation is ENABLED — this script bridges the gap
 *  - nodeIntegration is DISABLED — renderer has no direct Node access
 *  - Only specific, named methods are exposed (no require, no __dirname)
 *  - All IPC channels are validated against the whitelist
 *
 * Process: Preload (isolated bridge between Main and Renderer)
 */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const { IPC_CHANNELS } = require('../shared/constants');

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL ALLOWLIST
// Only channels explicitly listed here can be used by the renderer.
// This prevents renderer code from invoking arbitrary IPC channels.
// ─────────────────────────────────────────────────────────────────────────────

/** Channels the renderer is allowed to invoke (renderer → main) */
const ALLOWED_INVOKE_CHANNELS = [
  IPC_CHANNELS.ENGINE_VOICE_CONNECT,
  IPC_CHANNELS.ENGINE_VOICE_DISCONNECT,
  IPC_CHANNELS.ENGINE_SET_CODEC,
  IPC_CHANNELS.ENGINE_SET_EQ,
  IPC_CHANNELS.ENGINE_TOGGLE_MUTE,
  IPC_CHANNELS.ENGINE_TOGGLE_DEAFEN,
  IPC_CHANNELS.ENGINE_START_RECORDING,
  IPC_CHANNELS.ENGINE_STOP_RECORDING,
  IPC_CHANNELS.ENGINE_MIXER_UPDATE,
  IPC_CHANNELS.APP_GET_AUDIO_DEVICES,
  IPC_CHANNELS.APP_GET_VERSION,
];

/** Channels the renderer is allowed to listen on (main → renderer) */
const ALLOWED_LISTEN_CHANNELS = [
  IPC_CHANNELS.ENGINE_AUDIO_STATS,
  IPC_CHANNELS.ENGINE_VOICE_STATE,
  IPC_CHANNELS.ENGINE_CODEC_CHANGED,
  IPC_CHANNELS.ENGINE_RECORDING_STARTED,
  IPC_CHANNELS.ENGINE_RECORDING_STOPPED,
  IPC_CHANNELS.ENGINE_ERROR,
  // Tray → Renderer
  IPC_CHANNELS.TRAY_MUTE_TOGGLED,
  IPC_CHANNELS.TRAY_DEAFEN_TOGGLED,
  // Auto-updater → Renderer
  IPC_CHANNELS.UPDATER_CHECKING,
  IPC_CHANNELS.UPDATER_AVAILABLE,
  IPC_CHANNELS.UPDATER_UP_TO_DATE,
  IPC_CHANNELS.UPDATER_DOWNLOAD_PROGRESS,
  IPC_CHANNELS.UPDATER_DOWNLOADED,
  IPC_CHANNELS.UPDATER_ERROR,
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPOSED API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @namespace forusAPI
 * @description Safe API exposed to the renderer via contextBridge.
 * Available as `window.forusAPI` in renderer code.
 */
contextBridge.exposeInMainWorld('forusAPI', {

  // ── Engine control methods ─────────────────────────────────────────────────

  /**
   * Connect to a voice channel via the engine.
   * @param {string} channelId - The channel ID to join.
   * @param {string} serverUrl - The server WebRTC URL.
   * @returns {Promise<object>} Connection result from engine.
   */
  voiceConnect: (channelId, serverUrl) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_VOICE_CONNECT, { channelId, serverUrl }),

  /**
   * Disconnect from the current voice channel.
   * @returns {Promise<object>}
   */
  voiceDisconnect: () =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_VOICE_DISCONNECT),

  /**
   * Set the audio codec for the voice connection.
   * @param {string} codec - One of: 'flac', 'alac', 'opus', 'aac'
   * @param {object} [options] - Codec options (bitrate, sampleRate, bitDepth)
   * @returns {Promise<object>}
   */
  setCodec: (codec, options = {}) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_SET_CODEC, { codec, options }),

  /**
   * Configure EQ for a specific user's channel strip.
   * @param {string} userId
   * @param {string} band - 'low' | 'mid' | 'high'
   * @param {number} gain - Gain in dB (-20 to +20)
   * @param {number} freq - Center frequency in Hz
   * @param {number} Q - Q factor
   * @returns {Promise<object>}
   */
  setEQ: (userId, band, gain, freq, Q) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_SET_EQ, { userId, band, gain, freq, Q }),

  /**
   * Toggle microphone mute.
   * @param {boolean} muted
   * @returns {Promise<object>}
   */
  toggleMute: (muted) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_TOGGLE_MUTE, { muted }),

  /**
   * Toggle deafen (mute all incoming audio).
   * @param {boolean} deafened
   * @returns {Promise<object>}
   */
  toggleDeafen: (deafened) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_TOGGLE_DEAFEN, { deafened }),

  /**
   * Start recording the mix-down.
   * @param {string} format - 'flac' | 'wav'
   * @param {string} [filePath] - Output file path (optional, defaults to Documents/Forus Recordings/)
   * @returns {Promise<object>}
   */
  startRecording: (format, filePath) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_START_RECORDING, { format, filePath }),

  /**
   * Stop the current recording and finalize the file.
   * @returns {Promise<object>} Result including file path and duration.
   */
  stopRecording: () =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_STOP_RECORDING),

  /**
   * Update the mixer settings for a user channel strip.
   * @param {object} update - { userId, volume, pan, solo, mute }
   * @returns {Promise<object>}
   */
  mixerUpdate: (update) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENGINE_MIXER_UPDATE, update),

  // ── App-level queries ──────────────────────────────────────────────────────

  /**
   * Get the list of available audio input/output devices.
   * @returns {Promise<{inputs: MediaDeviceInfo[], outputs: MediaDeviceInfo[]}>}
   */
  getAudioDevices: () =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_AUDIO_DEVICES),

  /**
   * Get the current application version from package.json.
   * @returns {Promise<string>} e.g. "0.1.0"
   */
  getAppVersion: () =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),

  // ── Platform info ──────────────────────────────────────────────────────────

  /**
   * Get the current OS platform.
   * @returns {'win32'|'darwin'|'linux'}
   */
  platform: process.platform,

  /**
   * Whether the app is running in development mode.
   * @returns {boolean}
   */
  isDev: process.env.NODE_ENV === 'development',

  // ── Event listeners (engine → renderer) ───────────────────────────────────

  /**
   * Listen for a message from the engine (forwarded by main).
   * Validates channel against the whitelist before subscribing.
   *
   * @param {string} channel - An IPC_CHANNELS constant.
   * @param {function} callback - Called with (event, payload) on message.
   * @returns {function} Unsubscribe function — call to remove the listener.
   */
  onEngineMessage: (channel, callback) => {
    if (!ALLOWED_LISTEN_CHANNELS.includes(channel)) {
      console.warn(`[forusAPI] Blocked listen on unauthorized channel: "${channel}"`);
      return () => {};
    }
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(channel, listener);

    // Return an unsubscribe function
    return () => ipcRenderer.removeListener(channel, listener);
  },

  /**
   * Listen for a message from the engine exactly once.
   *
   * @param {string} channel
   * @param {function} callback
   */
  onEngineMessageOnce: (channel, callback) => {
    if (!ALLOWED_LISTEN_CHANNELS.includes(channel)) {
      console.warn(`[forusAPI] Blocked once-listen on unauthorized channel: "${channel}"`);
      return;
    }
    ipcRenderer.once(channel, (_event, payload) => callback(payload));
  },

  /**
   * Expose IPC channel name constants so renderer code can reference
   * them without needing direct access to shared/constants.js.
   */
  channels: { ...IPC_CHANNELS },
});
