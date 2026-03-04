/**
 * engine.js — Forus Audio Engine Entry Point
 *
 * This file is the entry point for the Engine child process.
 * It is spawned by the Main process via child_process.fork() and
 * runs as a completely isolated Node.js process.
 *
 * Responsibilities:
 *  - Listen for command messages from the Main process
 *  - Manage the VoiceConnection (WebRTC)
 *  - Manage the CodecManager (FLAC/ALAC/Opus/AAC)
 *  - Manage the DSPPipeline (EQ, filters, mixing)
 *  - Manage the AudioRecorder (FLAC/WAV mix-down)
 *  - Send audio stats and state events back to Main
 *  - Handle graceful shutdown
 *
 * IPC: Uses process.send() / process.on('message') for JSON messages.
 * No Electron APIs are used in this process.
 *
 * Process: Engine (Node.js child process)
 */

'use strict';

// Label this process for the logger
process.env.FORUS_PROCESS_NAME = 'engine';

const { ENGINE_MESSAGES, AUDIO_DEFAULTS, APP_CONSTANTS } = require('../shared/constants');
const { createLogger } = require('../shared/logger');

const VoiceConnection = require('./voice-connection');
const CodecManager = require('./codec-manager');
const DSPPipeline = require('./dsp-pipeline');
const AudioRecorder = require('./audio-recorder');

const log = createLogger('engine');

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

/** @type {VoiceConnection|null} Active voice connection */
let voiceConnection = null;

/** @type {CodecManager} Codec manager instance */
const codecManager = new CodecManager();

/** @type {DSPPipeline} DSP processing pipeline */
const dspPipeline = new DSPPipeline();

/** @type {AudioRecorder} Mix-down recorder */
const audioRecorder = new AudioRecorder();

/** @type {NodeJS.Timeout|null} Stats emission interval */
let statsInterval = null;

/** @type {boolean} Whether engine is shutting down */
let isShuttingDown = false;

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dispatches incoming messages from the Main process to the appropriate handler.
 * @param {{ type: string, payload: object }} message
 */
async function handleMessage(message) {
  if (!message || typeof message !== 'object') {
    log.warn('Received invalid message:', message);
    return;
  }

  const { type, payload = {} } = message;
  log.debug('Received message:', type);

  try {
    switch (type) {
      // ── Voice ────────────────────────────────────────────────────────
      case ENGINE_MESSAGES.VOICE_CONNECT:
        await handleVoiceConnect(payload);
        break;

      case ENGINE_MESSAGES.VOICE_DISCONNECT:
        await handleVoiceDisconnect();
        break;

      case ENGINE_MESSAGES.SET_MUTE:
        handleSetMute(payload);
        break;

      case ENGINE_MESSAGES.SET_DEAFEN:
        handleSetDeafen(payload);
        break;

      // ── Codec ────────────────────────────────────────────────────────
      case ENGINE_MESSAGES.SET_CODEC:
        handleSetCodec(payload);
        break;

      // ── DSP ────────────────────────────────────────────────────────────
      case ENGINE_MESSAGES.SET_EQ:
        handleSetEQ(payload);
        break;

      case ENGINE_MESSAGES.MIXER_UPDATE:
        handleMixerUpdate(payload);
        break;

      // ── Recording ────────────────────────────────────────────────────────
      case ENGINE_MESSAGES.START_RECORDING:
        await handleStartRecording(payload);
        break;

      case ENGINE_MESSAGES.STOP_RECORDING:
        await handleStopRecording();
        break;

      // ── System ─────────────────────────────────────────────────────────
      case ENGINE_MESSAGES.SHUTDOWN:
        await handleShutdown();
        break;

      default:
        log.warn('Unknown message type:', type);
    }
  } catch (err) {
    log.error(`Error handling message "${type}":`, err.message);
    sendToMain(ENGINE_MESSAGES.ERROR, {
      message: err.message,
      context: type,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleVoiceConnect({ channelId, serverUrl }) {
  log.info('Connecting to voice channel:', channelId, '@', serverUrl);

  if (voiceConnection) {
    await voiceConnection.disconnect();
  }

  voiceConnection = new VoiceConnection(channelId, serverUrl);

  voiceConnection.on('audioReceived', (userId, audioBuffer) => {
    const processedBuffer = dspPipeline.processChannel(userId, audioBuffer);
    if (audioRecorder.isRecording()) {
      audioRecorder.writeAudio(processedBuffer);
    }
  });

  voiceConnection.on('userJoined', (userId) => {
    log.info('User joined voice channel:', userId);
    dspPipeline.addChannel(userId);
    sendToMain(ENGINE_MESSAGES.VOICE_STATE_CHANGED, { event: 'user-joined', userId });
  });

  voiceConnection.on('userLeft', (userId) => {
    log.info('User left voice channel:', userId);
    dspPipeline.removeChannel(userId);
    sendToMain(ENGINE_MESSAGES.VOICE_STATE_CHANGED, { event: 'user-left', userId });
  });

  voiceConnection.on('stateChanged', (state) => {
    log.info('Voice connection state changed:', state);
    sendToMain(ENGINE_MESSAGES.VOICE_STATE_CHANGED, { state });
  });

  await voiceConnection.connect();
  startStatsEmission();

  sendToMain(ENGINE_MESSAGES.VOICE_STATE_CHANGED, { state: 'connected', channelId });
}

async function handleVoiceDisconnect() {
  log.info('Disconnecting from voice channel');
  stopStatsEmission();

  if (voiceConnection) {
    await voiceConnection.disconnect();
    voiceConnection = null;
  }

  sendToMain(ENGINE_MESSAGES.VOICE_STATE_CHANGED, { state: 'disconnected' });
}

function handleSetMute({ muted }) {
  log.info('Setting mute:', muted);
  if (voiceConnection) voiceConnection.setMuted(muted);
}

function handleSetDeafen({ deafened }) {
  log.info('Setting deafen:', deafened);
  if (voiceConnection) voiceConnection.setDeafened(deafened);
  dspPipeline.setGlobalDeafen(deafened);
}

function handleSetCodec({ codec, options = {} }) {
  log.info('Setting codec:', codec, options);
  codecManager.setActiveCodec(codec, options);
  if (voiceConnection) voiceConnection.setCodec(codec);
  sendToMain(ENGINE_MESSAGES.CODEC_CHANGED, { codec, config: codecManager.getActiveConfig() });
}

function handleSetEQ({ userId, band, gain, freq, Q }) {
  log.debug('Setting EQ for', userId, '-', band, gain, freq, Q);
  dspPipeline.setEQ(userId, band, gain, freq, Q);
}

function handleMixerUpdate(payload) {
  const { userId, volume, pan, solo, mute } = payload;
  log.debug('Mixer update for', userId);
  if (typeof volume === 'number') dspPipeline.setVolume(userId, volume);
  if (typeof pan === 'number')    dspPipeline.setPan(userId, pan);
  if (typeof solo === 'boolean')  dspPipeline.setSolo(userId, solo);
  if (typeof mute === 'boolean')  dspPipeline.setMute(userId, mute);
}

async function handleStartRecording({ format, filePath }) {
  log.info('Starting recording:', format, '->', filePath);
  await audioRecorder.start(format, filePath);
  sendToMain(ENGINE_MESSAGES.RECORDING_STARTED, { format, filePath });
}

async function handleStopRecording() {
  log.info('Stopping recording');
  const result = await audioRecorder.stop();
  sendToMain(ENGINE_MESSAGES.RECORDING_STOPPED, {
    filePath: result.filePath,
    duration: result.duration,
    format: result.format,
  });
}

async function handleShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log.info('Engine shutting down...');
  stopStatsEmission();

  if (audioRecorder.isRecording()) {
    try { await audioRecorder.stop(); } catch (e) {
      log.warn('Error stopping recorder during shutdown:', e.message);
    }
  }

  if (voiceConnection) {
    try { await voiceConnection.disconnect(); } catch (e) {
      log.warn('Error disconnecting voice during shutdown:', e.message);
    }
  }

  log.info('Engine shutdown complete');
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS EMISSION
// ─────────────────────────────────────────────────────────────────────────────

function startStatsEmission() {
  if (statsInterval) return;

  statsInterval = setInterval(() => {
    if (!voiceConnection) return;

    const stats = voiceConnection.getStats();
    const codecInfo = codecManager.getActiveConfig();

    sendToMain(ENGINE_MESSAGES.AUDIO_STATS, {
      latencyMs: stats.latencyMs,
      jitterMs: stats.jitterMs,
      bufferSize: AUDIO_DEFAULTS.bufferSize,
      sampleRate: AUDIO_DEFAULTS.sampleRate,
      codec: codecInfo.id,
      codecName: codecInfo.name,
      lossless: codecInfo.lossless,
      packetsLost: stats.packetsLost,
      bytesSent: stats.bytesSent,
      bytesReceived: stats.bytesReceived,
    });
  }, APP_CONSTANTS.statsIntervalMs);

  log.debug('Stats emission started');
}

function stopStatsEmission() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
    log.debug('Stats emission stopped');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IPC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sendToMain(type, payload = {}) {
  if (isShuttingDown && type !== ENGINE_MESSAGES.RECORDING_STOPPED) return;
  if (process.send) {
    process.send({ type, payload });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────────────────────────────────────

log.info('Forus Engine process starting...');

process.on('message', handleMessage);

process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err.message, err.stack);
  sendToMain(ENGINE_MESSAGES.ERROR, { message: err.message, stack: err.stack, fatal: true });
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
  sendToMain(ENGINE_MESSAGES.ERROR, { message: String(reason), fatal: false });
});

sendToMain(ENGINE_MESSAGES.READY, { pid: process.pid, nodeVersion: process.version });

log.info('Forus Engine ready — PID:', process.pid);
