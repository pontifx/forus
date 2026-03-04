/**
 * logger.js — Forus Structured Logger
 *
 * A lightweight structured logger that adds timestamps, log levels,
 * and process/module labels to every log entry.
 *
 * Usage:
 *   const { createLogger } = require('../shared/logger');
 *   const log = createLogger('my-module');
 *   log.info('Server started', { port: 3000 });
 *   log.error('Connection failed', err.message);
 *
 * Output format:
 *   [2026-03-01T10:00:00.000Z] [INFO ] [main/my-module] Server started { port: 3000 }
 *
 * Log levels (lowest to highest severity):
 *   debug → info → warn → error
 *
 * The current level can be controlled via the LOG_LEVEL environment variable.
 * Default level is 'info' in production, 'debug' in development.
 *
 * Process: Shared (Main, Renderer preload, Engine)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// LOG LEVEL CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Object.<string, number>} Numeric priority for each log level */
const LOG_LEVELS = Object.freeze({
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
  silent: 4,
});

/**
 * Determine the active log level from the environment.
 * Falls back to 'debug' in dev, 'info' in production.
 */
function getActiveLevel() {
  const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
  if (envLevel in LOG_LEVELS) return envLevel;
  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS LABEL
// Each process gets a short label so you can tell them apart in logs.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect which process is running this logger instance.
 * @returns {string} 'main' | 'renderer' | 'preload' | 'engine' | 'unknown'
 */
function detectProcessName() {
  // In the engine child process, we set FORUS_PROCESS_NAME
  if (process.env.FORUS_PROCESS_NAME) return process.env.FORUS_PROCESS_NAME;
  // Check if running in Electron's main process
  if (typeof process !== 'undefined' && process.type === 'browser') return 'main';
  if (typeof process !== 'undefined' && process.type === 'renderer') return 'renderer';
  // Preload scripts don't have process.type = 'renderer' in all Electron versions
  if (typeof window !== 'undefined') return 'preload';
  return 'node';
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ANSI color codes for terminal output.
 * These are stripped when not in a TTY environment.
 */
const COLORS = {
  reset:  '\x1b[0m',
  grey:   '\x1b[90m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  bold:   '\x1b[1m',
};

/** Whether to emit ANSI color codes */
const USE_COLORS = process.stdout && process.stdout.isTTY;

/**
 * Applies color if in a TTY, otherwise returns the string as-is.
 * @param {string} code - ANSI escape code from COLORS
 * @param {string} str - String to colorize
 * @returns {string}
 */
function colorize(code, str) {
  if (!USE_COLORS) return str;
  return `${code}${str}${COLORS.reset}`;
}

/**
 * Formats extra arguments (objects, arrays, primitives) as a string.
 * @param {Array} args - Additional arguments passed to the log call
 * @returns {string}
 */
function formatArgs(args) {
  if (!args.length) return '';
  return ' ' + args.map((a) => {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    }
    return String(a);
  }).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a named logger instance for a specific module.
 *
 * @param {string} moduleName - Short label for this module (e.g., 'engine', 'tray')
 * @returns {{ debug: function, info: function, warn: function, error: function }}
 */
function createLogger(moduleName) {
  const processName = detectProcessName();
  const label = `${processName}/${moduleName}`;

  /**
   * Internal log function.
   * @param {'debug'|'info'|'warn'|'error'} level
   * @param {string} message
   * @param {Array} extraArgs
   */
  function logAt(level, message, extraArgs) {
    const activeLevel = getActiveLevel();
    if (LOG_LEVELS[level] < LOG_LEVELS[activeLevel]) return;

    const timestamp = new Date().toISOString();
    const levelPadded = level.toUpperCase().padEnd(5);
    const extra = formatArgs(extraArgs);

    // Build the log line
    let line;
    if (USE_COLORS) {
      const tsColored    = colorize(COLORS.grey,   `[${timestamp}]`);
      const labelColored = colorize(COLORS.cyan,   `[${label}]`);
      let levelColored;
      switch (level) {
        case 'debug': levelColored = colorize(COLORS.grey,   `[${levelPadded}]`); break;
        case 'info':  levelColored = colorize(COLORS.bold,   `[${levelPadded}]`); break;
        case 'warn':  levelColored = colorize(COLORS.yellow, `[${levelPadded}]`); break;
        case 'error': levelColored = colorize(COLORS.red,    `[${levelPadded}]`); break;
        default:      levelColored = `[${levelPadded}]`;
      }
      line = `${tsColored} ${levelColored} ${labelColored} ${message}${extra}`;
    } else {
      line = `[${timestamp}] [${levelPadded}] [${label}] ${message}${extra}`;
    }

    // Output to the appropriate stream
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    /**
     * Log a debug message (only shown when LOG_LEVEL=debug).
     * @param {string} message
     * @param {...*} args
     */
    debug: (message, ...args) => logAt('debug', message, args),

    /**
     * Log an informational message.
     * @param {string} message
     * @param {...*} args
     */
    info: (message, ...args) => logAt('info', message, args),

    /**
     * Log a warning.
     * @param {string} message
     * @param {...*} args
     */
    warn: (message, ...args) => logAt('warn', message, args),

    /**
     * Log an error.
     * @param {string} message
     * @param {...*} args
     */
    error: (message, ...args) => logAt('error', message, args),
  };
}

module.exports = { createLogger };
