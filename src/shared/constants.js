/**
 * constants.js — Forus Shared Constants
 *
 * Single source of truth for IPC channel names, engine message types,
 * codec configurations, and audio defaults.
 *
 * Imported by: main process, preload script, renderer bridge, engine process.
 * Must use CommonJS exports (require/module.exports) for compatibility
 * across all process types.
 *
 * Process: Shared (Main, Renderer preload, Engine)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// IPC CHANNEL NAMES
// Renderer ↔ Main channels (ipcRenderer.invoke / ipcMain.handle)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IPC channels used between the renderer and the main process.
 * All channel names are namespaced with 'engine:' or 'app:' prefix.
 *
 * @type {Object.<string, string>}
 */
const IPC_CHANNELS = Object.freeze({
  // Voice connection
  ENGINE_VOICE_CONNECT:      'engine:voice-connect',
  ENGINE_VOICE_DISCONNECT:   'engine:voice-disconnect',

  // Codec selection
  ENGINE_SET_CODEC:          'engine:set-codec',

  // DSP / EQ
  ENGINE_SET_EQ:             'engine:set-eq',

  // Mute / Deafen
  ENGINE_TOGGLE_MUTE:        'engine:toggle-mute',
  ENGINE_TOGGLE_DEAFEN:      'engine:toggle-deafen',

  // Recording
  ENGINE_START_RECORDING:    'engine:start-recording',
  ENGINE_STOP_RECORDING:     'engine:stop-recording',

  // Mixer
  ENGINE_MIXER_UPDATE:       'engine:mixer-update',

  // Engine → Renderer (events sent from main to renderer)
  ENGINE_AUDIO_STATS:        'engine:audio-stats',
  ENGINE_VOICE_STATE:        'engine:voice-state-changed',
  ENGINE_CODEC_CHANGED:      'engine:codec-changed',
  ENGINE_RECORDING_STARTED:  'engine:recording-started',
  ENGINE_RECORDING_STOPPED:  'engine:recording-stopped',
  ENGINE_ERROR:              'engine:error',

  // App-level
  APP_GET_AUDIO_DEVICES:     'app:get-audio-devices',
  APP_GET_VERSION:           'app:get-version',

  // Tray → Renderer (events sent from tray/main to renderer)
  TRAY_MUTE_TOGGLED:         'tray:mute-toggled',
  TRAY_DEAFEN_TOGGLED:       'tray:deafen-toggled',

  // Auto-updater → Renderer (events sent from main to renderer)
  UPDATER_CHECKING:          'updater:checking',
  UPDATER_AVAILABLE:         'updater:update-available',
  UPDATER_UP_TO_DATE:        'updater:up-to-date',
  UPDATER_DOWNLOAD_PROGRESS: 'updater:download-progress',
  UPDATER_DOWNLOADED:        'updater:update-downloaded',
  UPDATER_ERROR:             'updater:error',
});

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE MESSAGE TYPES
// Main ↔ Engine messages (process.send / process.on('message'))
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Message types for the engine child process IPC.
 *
 * @type {Object.<string, string>}
 */
const ENGINE_MESSAGES = Object.freeze({
  // Commands (Main → Engine)
  VOICE_CONNECT:    'voice:connect',
  VOICE_DISCONNECT: 'voice:disconnect',
  SET_CODEC:        'codec:set',
  SET_EQ:           'dsp:set-eq',
  SET_MUTE:         'voice:set-mute',
  SET_DEAFEN:       'voice:set-deafen',
  START_RECORDING:  'recording:start',
  STOP_RECORDING:   'recording:stop',
  MIXER_UPDATE:     'mixer:update',
  SHUTDOWN:         'system:shutdown',

  // Events (Engine → Main)
  AUDIO_STATS:        'stats:audio',
  VOICE_STATE_CHANGED:'voice:state-changed',
  CODEC_CHANGED:      'codec:changed',
  RECORDING_STARTED:  'recording:started',
  RECORDING_STOPPED:  'recording:stopped',
  ERROR:              'system:error',
  READY:              'system:ready',
});

// ─────────────────────────────────────────────────────────────────────────────
// CODEC CONFIGURATIONS
// Default settings for each supported codec.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported codec identifiers.
 * @type {string[]}
 */
const SUPPORTED_CODECS = ['flac', 'alac', 'opus', 'aac'];

/**
 * Default configuration for each codec.
 *
 * @type {Object.<string, {
 *   id: string,
 *   name: string,
 *   sampleRate: number,
 *   bitDepth?: number,
 *   bitrate?: number,
 *   channels: number,
 *   lossless: boolean,
 *   description: string
 * }>}
 */
const CODEC_DEFAULTS = Object.freeze({
  flac: {
    id: 'flac',
    name: 'FLAC',
    sampleRate: 96000,
    bitDepth: 24,
    channels: 2,
    lossless: true,
    compressionLevel: 5,
    description: 'Free Lossless Audio Codec — 24-bit / 96 kHz',
  },
  alac: {
    id: 'alac',
    name: 'ALAC',
    sampleRate: 96000,
    bitDepth: 24,
    channels: 2,
    lossless: true,
    description: 'Apple Lossless Audio Codec — 24-bit / 96 kHz',
  },
  opus: {
    id: 'opus',
    name: 'Opus',
    sampleRate: 48000,
    bitrate: 320000,  // 320 kbps
    channels: 2,
    lossless: false,
    frameSize: 20,   // ms
    complexity: 10,
    description: 'Opus — 320 kbps, 48 kHz (high quality lossy)',
  },
  aac: {
    id: 'aac',
    name: 'AAC',
    sampleRate: 44100,
    bitrate: 256000,  // 256 kbps
    channels: 2,
    lossless: false,
    profile: 'LC',
    description: 'AAC-LC — 256 kbps, 44.1 kHz',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ENGINE DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default audio processing parameters.
 * @type {object}
 */
const AUDIO_DEFAULTS = Object.freeze({
  /** Default sample rate in Hz */
  sampleRate: 96000,

  /** Audio buffer size in samples (lower = less latency, more CPU) */
  bufferSize: 256,

  /** Number of audio channels (2 = stereo) */
  channels: 2,

  /** Bit depth for lossless codecs */
  bitDepth: 24,

  /** Voice activity detection threshold (-60 dBFS = very sensitive) */
  vadThreshold: -60,

  /** Noise gate threshold in dBFS */
  gateThreshold: -40,

  /** Maximum per-channel fader gain in dB */
  maxFaderGain: 6,

  /** Minimum per-channel fader gain in dB (below this = muted) */
  minFaderGain: -96,
});

// ─────────────────────────────────────────────────────────────────────────────
// DSP DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default DSP pipeline parameters.
 * @type {object}
 */
const DSP_DEFAULTS = Object.freeze({
  eq: {
    low:  { freq: 100,  gain: 0, Q: 0.707 },   // Low shelf at 100 Hz
    mid:  { freq: 1000, gain: 0, Q: 1.0   },   // Peaking at 1 kHz
    high: { freq: 8000, gain: 0, Q: 0.707 },   // High shelf at 8 kHz
  },
  highPassFilter: {
    freq: 80,
    resonance: 0.707,
    enabled: true,
  },
  lowPassFilter: {
    freq: 20000,
    resonance: 0.707,
    enabled: false,
  },
  pan: 0,           // Center (-1.0 = full left, 1.0 = full right)
  volume: 1.0,      // 0.0–1.0 (unity = 1.0, corresponds to 0 dB)
  masterVolume: 1.0,
  crossfader: 0.5,  // 0 = full A, 1 = full B, 0.5 = equal
});

// ─────────────────────────────────────────────────────────────────────────────
// APP CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Application-level constants.
 * @type {object}
 */
const APP_CONSTANTS = Object.freeze({
  appName: 'Forus',
  appId: 'studio.forus.app',
  engineRestartDelayMs: 2000,
  statsIntervalMs: 500,       // How often the engine sends audio stats
  reconnectDelayMs: 3000,     // WebRTC reconnect delay after disconnect
  maxReconnectAttempts: 5,
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  IPC_CHANNELS,
  ENGINE_MESSAGES,
  SUPPORTED_CODECS,
  CODEC_DEFAULTS,
  AUDIO_DEFAULTS,
  DSP_DEFAULTS,
  APP_CONSTANTS,
};
