/**
 * dsp-pipeline.js — Forus DSP Processing Pipeline
 *
 * Manages per-user channel strip DSP including:
 *  - 3-band parametric EQ (low shelf, mid peak, high shelf)
 *  - High-pass and low-pass filters with resonance
 *  - Pan control (constant-power panning)
 *  - Solo and mute per channel
 *  - Channel volume fader
 *  - Master volume fader
 *  - A/B crossfader
 *
 * In production, the DSP math would run on audio buffers using typed arrays
 * (Float32Array) with biquad filter coefficient computation for each band.
 * This implementation defines the correct interface and data model.
 *
 * Process: Engine
 */

'use strict';

const { createLogger } = require('../shared/logger');
const { DSP_DEFAULTS, AUDIO_DEFAULTS } = require('../shared/constants');

const log = createLogger('dsp-pipeline');

// ───────────────────────────────────────────────────────────────────────────────
// BIQUAD FILTER COEFFICIENTS
// Standard biquad filter implementations (RBJ Audio EQ Cookbook)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Computes biquad filter coefficients for a peaking EQ band.
 * (Robert Bristow-Johnson Audio EQ Cookbook)
 *
 * @param {number} freq - Center frequency in Hz
 * @param {number} gain - Gain in dB (-20 to +20)
 * @param {number} Q - Q factor
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {{ b0: number, b1: number, b2: number, a0: number, a1: number, a2: number }}
 */
function peakingEQCoeff(freq, gain, Q, sampleRate = AUDIO_DEFAULTS.sampleRate) {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const A  = Math.pow(10, gain / 40);
  const alpha = Math.sin(w0) / (2 * Q);

  const b0 =   1 + alpha * A;
  const b1 =  -2 * Math.cos(w0);
  const b2 =   1 - alpha * A;
  const a0 =   1 + alpha / A;
  const a1 =  -2 * Math.cos(w0);
  const a2 =   1 - alpha / A;

  return { b0, b1, b2, a0, a1, a2 };
}

/**
 * Computes biquad filter coefficients for a high-pass filter.
 *
 * @param {number} freq - Cutoff frequency in Hz
 * @param {number} resonance - Resonance / Q factor
 * @param {number} sampleRate
 * @returns {{ b0: number, b1: number, b2: number, a0: number, a1: number, a2: number }}
 */
function highPassCoeff(freq, resonance, sampleRate = AUDIO_DEFAULTS.sampleRate) {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const alpha = Math.sin(w0) / (2 * resonance);
  const cosW0 = Math.cos(w0);

  const b0 =  (1 + cosW0) / 2;
  const b1 = -(1 + cosW0);
  const b2 =  (1 + cosW0) / 2;
  const a0 =   1 + alpha;
  const a1 =  -2 * cosW0;
  const a2 =   1 - alpha;

  return { b0, b1, b2, a0, a1, a2 };
}

/**
 * Computes biquad filter coefficients for a low-pass filter.
 *
 * @param {number} freq - Cutoff frequency in Hz
 * @param {number} resonance
 * @param {number} sampleRate
 * @returns {{ b0: number, b1: number, b2: number, a0: number, a1: number, a2: number }}
 */
function lowPassCoeff(freq, resonance, sampleRate = AUDIO_DEFAULTS.sampleRate) {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const alpha = Math.sin(w0) / (2 * resonance);
  const cosW0 = Math.cos(w0);

  const b0 =  (1 - cosW0) / 2;
  const b1 =   1 - cosW0;
  const b2 =  (1 - cosW0) / 2;
  const a0 =   1 + alpha;
  const a1 =  -2 * cosW0;
  const a2 =   1 - alpha;

  return { b0, b1, b2, a0, a1, a2 };
}

// ───────────────────────────────────────────────────────────────────────────────
// CHANNEL STRIP MODEL
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Creates a default channel strip state object.
 * @param {string} userId
 * @returns {object}
 */
function createChannelStrip(userId) {
  return {
    userId,
    volume: 1.0,    // 0.0–1.0 (unity gain)
    pan: 0,         // -1.0 (left) to +1.0 (right)
    solo: false,
    mute: false,

    eq: {
      low:  { ...DSP_DEFAULTS.eq.low },
      mid:  { ...DSP_DEFAULTS.eq.mid },
      high: { ...DSP_DEFAULTS.eq.high },
    },

    highPassFilter: { ...DSP_DEFAULTS.highPassFilter },
    lowPassFilter:  { ...DSP_DEFAULTS.lowPassFilter  },

    // Biquad filter state (used in per-sample processing)
    _filterState: {
      eqLow:  { x1: 0, x2: 0, y1: 0, y2: 0 },
      eqMid:  { x1: 0, x2: 0, y1: 0, y2: 0 },
      eqHigh: { x1: 0, x2: 0, y1: 0, y2: 0 },
      hpf:    { x1: 0, x2: 0, y1: 0, y2: 0 },
      lpf:    { x1: 0, x2: 0, y1: 0, y2: 0 },
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// DSP PIPELINE CLASS
// ───────────────────────────────────────────────────────────────────────────────

class DSPPipeline {
  constructor() {
    /** @type {Map<string, object>} Per-user channel strips */
    this.channels = new Map();

    /** @type {number} Master volume (0.0–1.0) */
    this.masterVolume = DSP_DEFAULTS.masterVolume;

    /** @type {number} A/B crossfader position (0=full A, 1=full B, 0.5=equal) */
    this.crossfader = DSP_DEFAULTS.crossfader;

    /** @type {boolean} Global deafen — set all outputs to 0 */
    this.globalDeafen = false;

    log.info('DSPPipeline initialized');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHANNEL MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Adds a new channel strip for a user.
   * Creates with default DSP settings.
   *
   * @param {string} userId
   */
  addChannel(userId) {
    if (this.channels.has(userId)) {
      log.warn(`Channel already exists for user: ${userId}`);
      return;
    }
    this.channels.set(userId, createChannelStrip(userId));
    log.info(`Channel added for user: ${userId}`);
  }

  /**
   * Removes a user's channel strip.
   *
   * @param {string} userId
   */
  removeChannel(userId) {
    if (!this.channels.has(userId)) {
      log.warn(`No channel found for user: ${userId}`);
      return;
    }
    this.channels.delete(userId);
    log.info(`Channel removed for user: ${userId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EQ CONTROL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets a parametric EQ band for a user's channel.
   *
   * @param {string} userId
   * @param {'low'|'mid'|'high'} band - Which EQ band to adjust
   * @param {number} gain - Gain in dB (-20 to +20)
   * @param {number} freq - Center/shelf frequency in Hz
   * @param {number} Q - Q factor (bandwidth control)
   */
  setEQ(userId, band, gain, freq, Q) {
    const channel = this._getChannel(userId);
    if (!channel) return;

    if (!['low', 'mid', 'high'].includes(band)) {
      log.warn(`Invalid EQ band: "${band}"`);
      return;
    }

    channel.eq[band] = { freq, gain, Q };
    log.debug(`EQ set — user: ${userId}, band: ${band}, gain: ${gain}dB, freq: ${freq}Hz, Q: ${Q}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER CONTROL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets the high-pass or low-pass filter for a user's channel.
   *
   * @param {string} userId
   * @param {'highpass'|'lowpass'} type
   * @param {number} freq - Cutoff frequency in Hz
   * @param {number} resonance - Q / resonance factor
   */
  setFilter(userId, type, freq, resonance) {
    const channel = this._getChannel(userId);
    if (!channel) return;

    if (type === 'highpass') {
      channel.highPassFilter.freq = freq;
      channel.highPassFilter.resonance = resonance;
      channel.highPassFilter.enabled = true;
    } else if (type === 'lowpass') {
      channel.lowPassFilter.freq = freq;
      channel.lowPassFilter.resonance = resonance;
      channel.lowPassFilter.enabled = true;
    } else {
      log.warn(`Invalid filter type: "${type}"`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VOLUME AND PAN
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets the fader volume for a user's channel.
   * @param {string} userId
   * @param {number} volume - 0.0 (muted) to 1.0 (unity gain)
   */
  setVolume(userId, volume) {
    const channel = this._getChannel(userId);
    if (!channel) return;
    channel.volume = Math.max(0, Math.min(1, volume));
    log.debug(`Volume set — user: ${userId}, value: ${channel.volume}`);
  }

  /**
   * Sets the stereo pan position for a user's channel.
   * Uses constant-power (equal-power) panning law.
   *
   * @param {string} userId
   * @param {number} value - -1.0 (full left) to +1.0 (full right), 0 = center
   */
  setPan(userId, value) {
    const channel = this._getChannel(userId);
    if (!channel) return;
    channel.pan = Math.max(-1, Math.min(1, value));
    log.debug(`Pan set — user: ${userId}, value: ${channel.pan}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SOLO AND MUTE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets the solo state for a channel.
   * When any channel is soloed, only soloed channels are audible.
   *
   * @param {string} userId
   * @param {boolean} active
   */
  setSolo(userId, active) {
    const channel = this._getChannel(userId);
    if (!channel) return;
    channel.solo = active;
    log.info(`Solo ${active ? 'ON' : 'OFF'} — user: ${userId}`);
  }

  /**
   * Sets the mute state for a channel.
   * @param {string} userId
   * @param {boolean} active
   */
  setMute(userId, active) {
    const channel = this._getChannel(userId);
    if (!channel) return;
    channel.mute = active;
    log.info(`Mute ${active ? 'ON' : 'OFF'} — user: ${userId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MASTER CONTROLS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets the master output volume.
   * @param {number} value - 0.0 to 1.0
   */
  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    log.info('Master volume:', this.masterVolume);
  }

  /**
   * Sets the A/B crossfader position.
   * A/B assignment is managed per-channel (channel.ab = 'a' | 'b').
   *
   * @param {number} value - 0.0 (full A) to 1.0 (full B)
   */
  setCrossfader(value) {
    this.crossfader = Math.max(0, Math.min(1, value));
    log.debug('Crossfader:', this.crossfader);
  }

  /**
   * Globally mutes/unmutes all output (used for deafen).
   * @param {boolean} deafened
   */
  setGlobalDeafen(deafened) {
    this.globalDeafen = deafened;
    log.info('Global deafen:', deafened);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIO PROCESSING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Processes an incoming audio buffer through the channel's DSP chain.
   * Chain: HPF → LPF → EQ (low → mid → high) → pan → fader
   *
   * In production, operates on Float32Array samples with biquad filters.
   * The stub returns the input buffer unchanged.
   *
   * @param {string} userId
   * @param {Buffer} audioBuffer - Raw PCM audio buffer
   * @returns {Buffer} Processed audio buffer
   */
  processChannel(userId, audioBuffer) {
    const channel = this.channels.get(userId);
    if (!channel) return audioBuffer;

    // Check solo logic: if any channel is soloed, only play soloed channels
    const anySoloed = this._isAnySoloed();
    if ((anySoloed && !channel.solo) || channel.mute || this.globalDeafen) {
      // Return silence
      return Buffer.alloc(audioBuffer.length);
    }

    // Apply volume gain
    if (channel.volume === 0) {
      return Buffer.alloc(audioBuffer.length);
    }

    // ── Stub: real implementation would ──────────────────────────────────────
    // const samples = new Float32Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 4);
    // this._applyBiquad(samples, channel._filterState.hpf, highPassCoeff(channel.highPassFilter.freq, channel.highPassFilter.resonance));
    // this._applyBiquad(samples, channel._filterState.eqLow, peakingEQCoeff(channel.eq.low.freq, channel.eq.low.gain, channel.eq.low.Q));
    // this._applyBiquad(samples, channel._filterState.eqMid, peakingEQCoeff(channel.eq.mid.freq, channel.eq.mid.gain, channel.eq.mid.Q));
    // this._applyBiquad(samples, channel._filterState.eqHigh, peakingEQCoeff(channel.eq.high.freq, channel.eq.high.gain, channel.eq.high.Q));
    // this._applyPan(samples, channel.pan);
    // this._applyGain(samples, channel.volume * this.masterVolume);

    return audioBuffer;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gets a channel strip by userId with a warning if not found.
   * @param {string} userId
   * @returns {object|null}
   */
  _getChannel(userId) {
    const channel = this.channels.get(userId);
    if (!channel) {
      log.warn(`No channel strip found for user: ${userId}. Auto-creating.`);
      this.addChannel(userId);
      return this.channels.get(userId);
    }
    return channel;
  }

  /**
   * Returns true if any channel currently has solo active.
   * @returns {boolean}
   */
  _isAnySoloed() {
    for (const [, channel] of this.channels) {
      if (channel.solo) return true;
    }
    return false;
  }

  /**
   * Applies a biquad filter to a Float32Array of samples in-place.
   * Direct Form II Transposed implementation.
   *
   * @param {Float32Array} samples
   * @param {{ x1: number, x2: number, y1: number, y2: number }} state - Filter state (modified in place)
   * @param {{ b0: number, b1: number, b2: number, a0: number, a1: number, a2: number }} coeff
   */
  _applyBiquad(samples, state, coeff) {
    const { b0, b1, b2, a0, a1, a2 } = coeff;
    const norm = 1 / a0;
    let { x1, x2, y1, y2 } = state;

    for (let i = 0; i < samples.length; i++) {
      const x0 = samples[i];
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) * norm;
      samples[i] = y0;
      x2 = x1; x1 = x0;
      y2 = y1; y1 = y0;
    }

    state.x1 = x1; state.x2 = x2;
    state.y1 = y1; state.y2 = y2;
  }

  /**
   * Applies constant-power stereo panning to a stereo Float32Array.
   * Assumes interleaved LRLR samples.
   *
   * @param {Float32Array} samples - Interleaved stereo samples
   * @param {number} pan - -1.0 to +1.0
   */
  _applyPan(samples, pan) {
    const panRadians = (pan + 1) * Math.PI / 4; // Map [-1,1] to [0, π/2]
    const leftGain   = Math.cos(panRadians);
    const rightGain  = Math.sin(panRadians);

    for (let i = 0; i < samples.length; i += 2) {
      samples[i]     *= leftGain;   // L channel
      samples[i + 1] *= rightGain;  // R channel
    }
  }

  /**
   * Applies a linear gain to all samples in-place.
   * @param {Float32Array} samples
   * @param {number} gain - Linear gain multiplier
   */
  _applyGain(samples, gain) {
    for (let i = 0; i < samples.length; i++) {
      samples[i] *= gain;
    }
  }
}

module.exports = DSPPipeline;
