/**
 * audio-recorder.js — Forus Mix-Down Audio Recorder
 *
 * Records the mixed audio output to a file in FLAC or WAV format.
 * The recorder receives processed audio from the DSP pipeline and
 * writes it to disk, supporting high-resolution formats up to 32/192.
 *
 * Supported output formats:
 *  - FLAC: Lossless, compressed, 24-bit recommended
 *  - WAV:  Lossless, uncompressed PCM, maximum compatibility
 *
 * In production, FLAC encoding would use a streaming encoder (libflac.js)
 * and WAV writing would follow the standard RIFF/WAVE specification.
 *
 * Process: Engine
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../shared/logger');
const { AUDIO_DEFAULTS } = require('../shared/constants');

const log = createLogger('audio-recorder');

class AudioRecorder {
  constructor() {
    /** @type {boolean} Whether recording is currently active */
    this._recording = false;

    /** @type {string|null} Output file path */
    this._filePath = null;

    /** @type {'flac'|'wav'|null} Output format */
    this._format = null;

    /** @type {number|null} Recording start timestamp (ms) */
    this._startTime = null;

    /** @type {fs.WriteStream|null} File write stream */
    this._stream = null;

    /** @type {number} Total bytes written */
    this._bytesWritten = 0;

    /** @type {number} Total audio frames written */
    this._framesWritten = 0;

    log.info('AudioRecorder initialized');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Starts recording to the specified file.
   *
   * @param {'flac'|'wav'} format - Output format
   * @param {string} filePath - Full output file path (including extension)
   * @returns {Promise<void>}
   * @throws {Error} If recording is already active or the directory is not writable.
   */
  async start(format, filePath) {
    if (this._recording) {
      throw new Error('Recording already in progress. Call stop() first.');
    }

    const validFormats = ['flac', 'wav'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format: "${format}". Must be 'flac' or 'wav'`);
    }

    // Ensure the output directory exists
    const dir = path.dirname(filePath);
    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch (e) {
      throw new Error(`Cannot create output directory "${dir}": ${e.message}`);
    }

    this._format = format;
    this._filePath = filePath;
    this._startTime = Date.now();
    this._bytesWritten = 0;
    this._framesWritten = 0;

    // Open the file write stream
    this._stream = fs.createWriteStream(filePath, { flags: 'w' });

    this._stream.on('error', (err) => {
      log.error('Write stream error:', err.message);
      this._recording = false;
    });

    // Write the file header
    if (format === 'wav') {
      await this._writeWAVHeader();
    } else {
      await this._writeFLACHeader();
    }

    this._recording = true;
    log.info(`Recording started — format: ${format}, path: ${filePath}`);
  }

  /**
   * Stops the recording, finalizes the file, and returns metadata.
   *
   * @returns {Promise<{ filePath: string, format: string, duration: number, sizeBytes: number }>}
   * @throws {Error} If no recording is active.
   */
  async stop() {
    if (!this._recording) {
      throw new Error('No recording in progress.');
    }

    this._recording = false;
    const duration = this.getElapsedTime();

    // Finalize the file (WAV requires updating the chunk sizes in the header)
    if (this._format === 'wav') {
      await this._finalizeWAV();
    } else {
      await this._finalizeFLAC();
    }

    // Close the write stream
    await new Promise((resolve, reject) => {
      this._stream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const result = {
      filePath: this._filePath,
      format: this._format,
      duration,
      sizeBytes: this._bytesWritten,
    };

    log.info(`Recording stopped — duration: ${duration.toFixed(2)}s, size: ${this._bytesWritten} bytes`);

    // Reset state
    this._stream = null;
    this._filePath = null;
    this._format = null;
    this._startTime = null;

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIO INPUT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Writes a processed audio buffer to the recording file.
   * Called by the DSP pipeline on each audio frame.
   *
   * @param {Buffer} audioBuffer - Processed PCM audio data
   */
  writeAudio(audioBuffer) {
    if (!this._recording || !this._stream) return;

    this._stream.write(audioBuffer);
    this._bytesWritten += audioBuffer.length;
    this._framesWritten++;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns whether recording is currently active.
   * @returns {boolean}
   */
  isRecording() {
    return this._recording;
  }

  /**
   * Returns the elapsed recording time in seconds.
   * @returns {number}
   */
  getElapsedTime() {
    if (!this._startTime) return 0;
    return (Date.now() - this._startTime) / 1000;
  }

  /**
   * Returns recording stats.
   * @returns {{ recording: boolean, elapsedSeconds: number, bytesWritten: number, framesWritten: number }}
   */
  getStats() {
    return {
      recording: this._recording,
      elapsedSeconds: this.getElapsedTime(),
      bytesWritten: this._bytesWritten,
      framesWritten: this._framesWritten,
      filePath: this._filePath,
      format: this._format,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE: WAV FILE HANDLING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Writes a standard RIFF/WAVE file header (placeholder sizes).
   * The header is finalized with correct sizes when recording stops.
   *
   * WAV header format:
   *  RIFF chunk (12 bytes) + fmt chunk (24 bytes) + data chunk (8 bytes + audio)
   *
   * @returns {Promise<void>}
   */
  async _writeWAVHeader() {
    const sampleRate = AUDIO_DEFAULTS.sampleRate;
    const channels   = AUDIO_DEFAULTS.channels;
    const bitDepth   = AUDIO_DEFAULTS.bitDepth;
    const byteRate   = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);

    const header = Buffer.alloc(44);
    let offset = 0;

    // RIFF chunk descriptor
    header.write('RIFF', offset, 'ascii'); offset += 4;
    header.writeUInt32LE(0, offset); offset += 4;  // Placeholder: file size - 8
    header.write('WAVE', offset, 'ascii'); offset += 4;

    // fmt sub-chunk
    header.write('fmt ', offset, 'ascii'); offset += 4;
    header.writeUInt32LE(16, offset); offset += 4;         // Sub-chunk size (PCM = 16)
    header.writeUInt16LE(1, offset); offset += 2;          // Audio format (1 = PCM)
    header.writeUInt16LE(channels, offset); offset += 2;
    header.writeUInt32LE(sampleRate, offset); offset += 4;
    header.writeUInt32LE(byteRate, offset); offset += 4;
    header.writeUInt16LE(blockAlign, offset); offset += 2;
    header.writeUInt16LE(bitDepth, offset); offset += 2;

    // data sub-chunk
    header.write('data', offset, 'ascii'); offset += 4;
    header.writeUInt32LE(0, offset);  // Placeholder: audio data size

    await this._writeBuffer(header);
    log.debug('WAV header written');
  }

  /**
   * Finalizes the WAV file by patching the size fields in the header.
   * Reopens the file and writes the correct chunk sizes.
   *
   * @returns {Promise<void>}
   */
  async _finalizeWAV() {
    if (!this._filePath) return;

    const dataSize = this._bytesWritten - 44; // Subtract header size
    const riffSize = dataSize + 44 - 8;        // Total file size - 8

    try {
      const fd = await fs.promises.open(this._filePath, 'r+');
      const sizeBuf = Buffer.alloc(4);

      // Patch RIFF chunk size at offset 4
      sizeBuf.writeUInt32LE(riffSize, 0);
      await fd.write(sizeBuf, 0, 4, 4);

      // Patch data chunk size at offset 40
      sizeBuf.writeUInt32LE(dataSize, 0);
      await fd.write(sizeBuf, 0, 4, 40);

      await fd.close();
      log.debug(`WAV finalized — RIFF: ${riffSize}, data: ${dataSize}`);
    } catch (e) {
      log.error('Failed to finalize WAV:', e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE: FLAC FILE HANDLING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Writes a minimal FLAC stream marker.
   * Real FLAC encoding requires writing STREAMINFO and PADDING metadata blocks
   * followed by encoded audio frames.
   *
   * Real implementation would use:
   *  - libflac.js (WASM) or node-flac
   *
   * @returns {Promise<void>}
   */
  async _writeFLACHeader() {
    // FLAC stream marker: 0x664C6143 = "fLaC"
    const marker = Buffer.from([0x66, 0x4C, 0x61, 0x43]);
    await this._writeBuffer(marker);
    log.debug('FLAC stream marker written (stub)');
  }

  /**
   * Finalizes the FLAC recording.
   * In production, this would flush any remaining encoder frames.
   *
   * @returns {Promise<void>}
   */
  async _finalizeFLAC() {
    log.debug('FLAC finalized (stub)');
    // Real implementation: encoder.finish()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE: STREAM HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Writes a buffer to the stream and waits for the drain event if needed.
   * @param {Buffer} buffer
   * @returns {Promise<void>}
   */
  _writeBuffer(buffer) {
    return new Promise((resolve, reject) => {
      if (!this._stream) {
        reject(new Error('No active write stream'));
        return;
      }
      const canContinue = this._stream.write(buffer);
      this._bytesWritten += buffer.length;
      if (canContinue) {
        resolve();
      } else {
        this._stream.once('drain', resolve);
        this._stream.once('error', reject);
      }
    });
  }
}

module.exports = AudioRecorder;
