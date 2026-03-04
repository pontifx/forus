/**
 * codec-manager.js — Forus Audio Codec Manager
 *
 * Manages audio codec selection, configuration, and encode/decode operations.
 * Supports FLAC (lossless), ALAC (lossless), Opus (high-quality lossy),
 * and AAC (lossy compatibility).
 *
 * In production, encoding/decoding would use native Node.js addons or
 * WASM modules (e.g., libflac.js, opusjs). The stubs here define the
 * correct interfaces and error handling patterns.
 *
 * Process: Engine
 */

'use strict';

const { createLogger } = require('../shared/logger');
const { CODEC_DEFAULTS, SUPPORTED_CODECS } = require('../shared/constants');

const log = createLogger('codec-manager');

class CodecManager {
  constructor() {
    /** @type {string} Currently active codec identifier */
    this.activeCodec = 'flac';

    /** @type {object} Current codec configuration (merged with defaults) */
    this.activeConfig = { ...CODEC_DEFAULTS.flac };

    /** @type {Map<string, object>} Per-codec configuration overrides */
    this.configOverrides = new Map();

    log.info('CodecManager initialized — default codec: flac');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CODEC SELECTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets the active codec and applies optional configuration overrides.
   *
   * @param {string} codec - Codec identifier: 'flac' | 'alac' | 'opus' | 'aac'
   * @param {object} [options] - Optional overrides (bitrate, sampleRate, bitDepth, etc.)
   * @throws {Error} If the codec is not supported.
   */
  setActiveCodec(codec, options = {}) {
    if (!SUPPORTED_CODECS.includes(codec)) {
      throw new Error(`Unsupported codec: "${codec}". Supported: ${SUPPORTED_CODECS.join(', ')}`);
    }

    this.activeCodec = codec;
    this.activeConfig = {
      ...CODEC_DEFAULTS[codec],
      ...options,
    };

    // Store overrides for this codec
    this.configOverrides.set(codec, options);

    log.info(`Active codec changed to "${codec}":`, this.activeConfig);
  }

  /**
   * Returns the active codec configuration.
   * @returns {object}
   */
  getActiveConfig() {
    return { ...this.activeConfig };
  }

  /**
   * Returns the list of all supported codecs with their default configurations.
   * @returns {Array<object>}
   */
  getSupportedCodecs() {
    return SUPPORTED_CODECS.map((id) => ({
      ...CODEC_DEFAULTS[id],
      ...(this.configOverrides.get(id) || {}),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENCODE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Encodes a raw PCM audio buffer using the specified codec.
   *
   * In production:
   *  - FLAC: Use libflac.js (WASM) or flac npm package
   *  - ALAC: Use alac-encoder npm package or FFMPEG bindings
   *  - Opus: Use @discordjs/opus or opusscript npm package
   *  - AAC:  Use ffmpeg via fluent-ffmpeg or native WASM
   *
   * @param {Buffer} pcmBuffer - Raw 32-bit float PCM audio data.
   * @param {string} [codec] - Override codec (defaults to active codec).
   * @param {object} [options] - Encoding options to override defaults.
   * @returns {Promise<Buffer>} Encoded audio buffer.
   */
  async encode(pcmBuffer, codec = this.activeCodec, options = {}) {
    if (!Buffer.isBuffer(pcmBuffer)) {
      throw new TypeError('pcmBuffer must be a Buffer');
    }

    const config = {
      ...CODEC_DEFAULTS[codec],
      ...(this.configOverrides.get(codec) || {}),
      ...options,
    };

    log.debug(`Encoding ${pcmBuffer.length} bytes with ${codec}`);

    // ── Stub implementations ───────────────────────────────────────────────
    switch (codec) {
      case 'flac':
        return this._encodeFLAC(pcmBuffer, config);
      case 'alac':
        return this._encodeALAC(pcmBuffer, config);
      case 'opus':
        return this._encodeOpus(pcmBuffer, config);
      case 'aac':
        return this._encodeAAC(pcmBuffer, config);
      default:
        throw new Error(`No encoder available for codec: ${codec}`);
    }
  }

  /**
   * Decodes an encoded audio buffer back to raw PCM.
   *
   * @param {Buffer} encodedBuffer - Codec-encoded audio data.
   * @param {string} [codec] - Codec to decode with (defaults to active codec).
   * @returns {Promise<Buffer>} Decoded PCM audio buffer (32-bit float).
   */
  async decode(encodedBuffer, codec = this.activeCodec) {
    if (!Buffer.isBuffer(encodedBuffer)) {
      throw new TypeError('encodedBuffer must be a Buffer');
    }

    log.debug(`Decoding ${encodedBuffer.length} bytes with ${codec}`);

    switch (codec) {
      case 'flac':
        return this._decodeFLAC(encodedBuffer);
      case 'alac':
        return this._decodeALAC(encodedBuffer);
      case 'opus':
        return this._decodeOpus(encodedBuffer);
      case 'aac':
        return this._decodeAAC(encodedBuffer);
      default:
        throw new Error(`No decoder available for codec: ${codec}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STUB ENCODERS / DECODERS
  // Replace these with real implementations using native addons or WASM.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * FLAC encoder stub.
   * Real implementation: node-flac or libflac.js WASM
   * @param {Buffer} pcm
   * @param {object} config - { sampleRate, bitDepth, channels, compressionLevel }
   * @returns {Promise<Buffer>}
   */
  async _encodeFLAC(pcm, config) {
    return pcm;
  }

  /**
   * FLAC decoder stub.
   * @param {Buffer} flac
   * @returns {Promise<Buffer>}
   */
  async _decodeFLAC(flac) {
    return flac; // Passthrough stub
  }

  /**
   * ALAC encoder stub.
   * Real implementation: alac-encoder or FFMPEG
   * @param {Buffer} pcm
   * @param {object} config
   * @returns {Promise<Buffer>}
   */
  async _encodeALAC(pcm, config) {
    return pcm; // Passthrough stub
  }

  /**
   * ALAC decoder stub.
   * @param {Buffer} alac
   * @returns {Promise<Buffer>}
   */
  async _decodeALAC(alac) {
    return alac; // Passthrough stub
  }

  /**
   * Opus encoder stub.
   * Real implementation: @discordjs/opus or opusscript
   * @param {Buffer} pcm - 16-bit signed integer PCM expected by Opus
   * @param {object} config - { bitrate, sampleRate, channels, frameSize, complexity }
   * @returns {Promise<Buffer>}
   */
  async _encodeOpus(pcm, config) {
    return pcm; // Passthrough stub
  }

  /**
   * Opus decoder stub.
   * @param {Buffer} opus
   * @returns {Promise<Buffer>}
   */
  async _decodeOpus(opus) {
    return opus; // Passthrough stub
  }

  /**
   * AAC encoder stub.
   * Real implementation: FFMPEG or faac bindings
   * @param {Buffer} pcm
   * @param {object} config
   * @returns {Promise<Buffer>}
   */
  async _encodeAAC(pcm, config) {
    return pcm; // Passthrough stub
  }

  /**
   * AAC decoder stub.
   * @param {Buffer} aac
   * @returns {Promise<Buffer>}
   */
  async _decodeAAC(aac) {
    return aac; // Passthrough stub
  }
}

module.exports = CodecManager;
