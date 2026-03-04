/**
 * voice-connection.js — Forus WebRTC Voice Connection Manager
 *
 * Manages the WebRTC peer connection for a single voice channel session.
 * Handles peer signaling, audio track management, connection state,
 * and reconnection logic.
 *
 * In a production implementation, this would use a WebRTC library such as
 * `wrtc` (Node.js native bindings) or `node-webrtc`. The stubs here define
 * the correct interface and event contract.
 *
 * Integration points:
 *  - engine.js creates a VoiceConnection per channel join
 *  - Emits 'audioReceived' with (userId, audioBuffer) for DSP processing
 *  - Emits 'userJoined' / 'userLeft' for mixer channel management
 *  - Emits 'stateChanged' for UI status updates
 *
 * Process: Engine
 */

'use strict';

const EventEmitter = require('events');
const { createLogger } = require('../shared/logger');
const { AUDIO_DEFAULTS, APP_CONSTANTS } = require('../shared/constants');

const log = createLogger('voice-connection');

/**
 * @typedef {'idle'|'connecting'|'connected'|'reconnecting'|'disconnected'|'failed'} ConnectionState
 */

class VoiceConnection extends EventEmitter {
  /**
   * @param {string} channelId - The channel to connect to.
   * @param {string} serverUrl - The signaling server URL.
   */
  constructor(channelId, serverUrl) {
    super();

    /** @type {string} */
    this.channelId = channelId;

    /** @type {string} */
    this.serverUrl = serverUrl;

    /** @type {ConnectionState} */
    this.state = 'idle';

    /** @type {boolean} */
    this.isMuted = false;

    /** @type {boolean} */
    this.isDeafened = false;

    /** @type {string} Active codec identifier */
    this.activeCodec = 'flac';

    /** @type {Map<string, object>} Map of userId → peer connection state */
    this.peers = new Map();

    /** @type {number} Reconnection attempt counter */
    this.reconnectAttempts = 0;

    /** @type {NodeJS.Timeout|null} Reconnect timer */
    this.reconnectTimer = null;

    // ── Simulated stats (replaced by real WebRTC stats in production) ────────
    /** @type {number} Simulated round-trip latency in milliseconds */
    this._simLatencyMs = 8;

    /** @type {NodeJS.Timeout|null} Simulation tick timer */
    this._simTimer = null;

    log.info(`VoiceConnection created — channel: ${channelId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Establishes the WebRTC connection to the voice server.
   *
   * In production, this would:
   *  1. Connect to the signaling WebSocket at this.serverUrl
   *  2. Exchange SDP offer/answer with the SFU (Selective Forwarding Unit)
   *  3. Add local audio track from getUserMedia
   *  4. Handle ICE candidates
   *  5. Receive remote audio tracks per user
   *
   * @returns {Promise<void>}
   */
  async connect() {
    log.info(`Connecting to channel "${this.channelId}" at ${this.serverUrl}`);
    this._setState('connecting');

    try {
      // ── Stub: simulate connection establishment ───────────────────────
      // Real implementation: await this._setupWebRTC();
      await this._simulateConnection();

      this._setState('connected');
      this.reconnectAttempts = 0;
      log.info(`Connected to voice channel "${this.channelId}"`);

    } catch (err) {
      log.error('Connection failed:', err.message);
      this._setState('failed');
      throw err;
    }
  }

  /**
   * Disconnects from the voice channel and cleans up resources.
   *
   * @returns {Promise<void>}
   */
  async disconnect() {
    log.info(`Disconnecting from channel "${this.channelId}"`);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this._simTimer) {
      clearInterval(this._simTimer);
      this._simTimer = null;
    }

    // ── Stub: close all peer connections ─────────────────────────────────────
    // Real implementation:
    // for (const [userId, peer] of this.peers) {
    //   peer.peerConnection.close();
    //   this.emit('userLeft', userId);
    // }
    // this.peers.clear();
    // this.signalingSocket?.close();

    this._setState('disconnected');
    log.info(`Disconnected from "${this.channelId}"`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIO CONTROLS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Mutes or unmutes the local microphone track.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.isMuted = muted;
    log.info('Microphone mute:', muted);

    // Real implementation:
    // if (this.localAudioTrack) {
    //   this.localAudioTrack.enabled = !muted;
    // }
  }

  /**
   * Deafens or undeafens (mutes all incoming audio).
   * @param {boolean} deafened
   */
  setDeafened(deafened) {
    this.isDeafened = deafened;
    log.info('Deafen:', deafened);

    // Real implementation:
    // for (const [, peer] of this.peers) {
    //   peer.remoteAudioElement.muted = deafened;
    // }
  }

  /**
   * Updates the active codec for the voice connection.
   * In production, this would renegotiate the peer connection codec.
   *
   * @param {string} codec - 'flac' | 'alac' | 'opus' | 'aac'
   */
  setCodec(codec) {
    this.activeCodec = codec;
    log.info('Codec set:', codec);

    // Real implementation:
    // await this._renegotiateCodec(codec);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns current connection statistics.
   * In production, uses RTCPeerConnection.getStats().
   *
   * @returns {{
   *   latencyMs: number,
   *   jitterMs: number,
   *   packetsLost: number,
   *   bytesSent: number,
   *   bytesReceived: number,
   *   state: ConnectionState
   * }}
   */
  getStats() {
    // Stub: return simulated stats
    return {
      latencyMs: this._simLatencyMs + Math.random() * 2 - 1, // ± 1ms jitter
      jitterMs: Math.random() * 0.5,
      packetsLost: 0,
      bytesSent: Math.floor(Math.random() * 10000),
      bytesReceived: Math.floor(Math.random() * 50000),
      state: this.state,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RECONNECTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Attempts to reconnect after a connection drop.
   * Uses exponential backoff up to APP_CONSTANTS.maxReconnectAttempts.
   */
  _scheduleReconnect() {
    if (this.reconnectAttempts >= APP_CONSTANTS.maxReconnectAttempts) {
      log.error('Max reconnect attempts reached — giving up');
      this._setState('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = APP_CONSTANTS.reconnectDelayMs * this.reconnectAttempts;
    log.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this._setState('reconnecting');

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (err) {
        log.warn('Reconnect attempt failed:', err.message);
        this._scheduleReconnect();
      }
    }, delay);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Updates the connection state and emits a stateChanged event.
   * @param {ConnectionState} newState
   */
  _setState(newState) {
    if (this.state === newState) return;
    log.debug(`State: ${this.state} → ${newState}`);
    this.state = newState;
    this.emit('stateChanged', newState);
  }

  /**
   * Stub: simulates a successful connection with fake users.
   * Replace with real WebRTC signaling logic in production.
   *
   * @returns {Promise<void>}
   */
  async _simulateConnection() {
    // Simulate ~100ms handshake
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Emit fake user join events for the prototype
    const fakeUsers = ['user-alpha', 'user-beta'];
    for (const userId of fakeUsers) {
      this.peers.set(userId, { userId, joined: Date.now() });
      this.emit('userJoined', userId);
    }

    // Simulate receiving audio frames at 20ms intervals
    this._simTimer = setInterval(() => {
      if (this.isDeafened) return;

      for (const [userId] of this.peers) {
        // Create a mock audio buffer (silence in the stub)
        const mockBuffer = Buffer.alloc(
          AUDIO_DEFAULTS.bufferSize * AUDIO_DEFAULTS.channels * 4
        );
        this.emit('audioReceived', userId, mockBuffer);
      }
    }, 20);
  }
}

module.exports = VoiceConnection;
