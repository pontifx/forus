# Forus

> High-fidelity voice for audiophiles — a Discord alternative built for uncompromising audio quality.

Forus is an Electron-based desktop application featuring lossless voice channels (FLAC 24/96, ALAC), professional-grade DSP, per-user channel mixing, and a full-featured audio console — all in a Discord-style UI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FORUS ELECTRON APP                       │
│                                                                 │
│  ┌─────────────────┐    IPC     ┌─────────────────────────────┐ │
│  │  MAIN PROCESS   │◄──────────►│     RENDERER PROCESS        │ │
│  │  (src/main/)    │            │     (src/renderer/)         │ │
│  │                 │            │                             │ │
│  │ • Window mgmt   │  preload   │ • Forus UI (HTML/CSS/JS)    │ │
│  │ • System tray   │  bridge    │ • Server/channel sidebar    │ │
│  │ • Auto-updater  │            │ • Voice channel view        │ │
│  │ • Native APIs   │            │ • Mix console               │ │
│  │ • IPC bridge    │            │ • Discord migration wizard  │ │
│  └────────┬────────┘            └─────────────────────────────┘ │
│           │                                                      │
│           │  child_process.fork()                               │
│           │  process.send() / process.on('message')            │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  ENGINE PROCESS │                                            │
│  │  (src/engine/)  │                                            │
│  │                 │                                            │
│  │ • WebRTC peers  │                                            │
│  │ • FLAC/Opus/AAC │                                            │
│  │ • DSP pipeline  │                                            │
│  │ • EQ / filters  │                                            │
│  │ • Mixing        │                                            │
│  │ • Recording     │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 9 or later
- macOS 12+, Windows 10+, or Ubuntu 20.04+

---

## Quick Start

```bash
# Clone or navigate to the project
cd forus-electron

# Install dependencies
npm install

# Start the app
npm start

# Start in development mode (with NODE_ENV=development)
npm run dev
```

---

## Build Instructions

### macOS (DMG + ZIP)
```bash
npm run build:mac
```
Output: `dist/` — produces `.dmg` and `.zip` for macOS.

### Windows (NSIS installer + portable EXE)
```bash
npm run build:win
```
Output: `dist/` — produces NSIS `.exe` installer and portable `.exe`.

### Linux (AppImage + DEB)
```bash
npm run build:linux
```
Output: `dist/` — produces `.AppImage` and `.deb` packages.

---

## Project Structure

```
forus-electron/
├── package.json              # Project manifest, scripts, build config
├── electron-builder.yml      # electron-builder platform targets
├── .gitignore
├── README.md
├── src/
│   ├── main/                 # Electron Main Process (Node.js + Electron APIs)
│   │   ├── main.js           # Entry point: BrowserWindow, spawns engine
│   │   ├── tray.js           # System tray icon and context menu
│   │   ├── ipc-handlers.js   # IPC bridge: renderer ↔ main ↔ engine
│   │   ├── auto-updater.js   # electron-updater integration (stub)
│   │   └── preload.js        # contextBridge: exposes forusAPI to renderer
│   ├── renderer/             # Renderer Process (Chromium context)
│   │   ├── index.html        # Main application HTML shell
│   │   ├── base.css          # Global reset and defaults
│   │   ├── style.css         # Design tokens, components, layout
│   │   ├── app.js            # Forus interactive prototype logic
│   │   └── renderer-bridge.js # Connects forusAPI to UI state
│   ├── engine/               # Engine Process (Node.js child process)
│   │   ├── engine.js         # Entry: listens for IPC from main
│   │   ├── voice-connection.js # WebRTC peer connection management
│   │   ├── codec-manager.js  # FLAC/ALAC/Opus/AAC codec handling
│   │   ├── dsp-pipeline.js   # EQ, filters, mixing, crossfader chain
│   │   └── audio-recorder.js # Record mix-down to FLAC/WAV
│   └── shared/               # Shared between all processes
│       ├── constants.js      # IPC channel names, codec configs, defaults
│       └── logger.js         # Structured logger with process labels
├── assets/
│   ├── icon.png              # 512×512 app icon
│   └── tray-icon.png         # 16×16 tray icon
└── scripts/
    └── dev.js                # Dev helper: spawns electron with NODE_ENV=development
```

---

## Development Notes

### Process Communication

All IPC between the renderer and engine must go through the main process:

```
Renderer → (ipcRenderer.invoke) → Main → (process.send) → Engine
Engine   → (process.send)       → Main → (ipcMain.emit)  → Renderer
```

The `preload.js` contextBridge exposes a `forusAPI` object to the renderer that abstracts this flow. **Never enable `nodeIntegration: true`** — all Node access must go through the bridge.

### Engine Process

The engine (`src/engine/engine.js`) is spawned via `child_process.fork()`. It runs as a separate Node.js process and communicates exclusively through `process.send()` / `process.on('message')`. This isolates audio processing from the UI thread, preventing audio glitches during heavy rendering.

### Adding New IPC Channels

1. Add the channel constant to `src/shared/constants.js`
2. Register the handler in `src/main/ipc-handlers.js`
3. Add the engine handler in `src/engine/engine.js`
4. Expose the method in `src/main/preload.js` if the renderer needs it

### Audio Architecture

```
Microphone Input
     ↓
Voice Activity Detection (VAD)
     ↓
DSP Pipeline (EQ → HPF/LPF → Gate)
     ↓
Codec Encoder (FLAC / Opus / AAC)
     ↓
WebRTC Send Channel
     ↓  (network)
WebRTC Receive Channel
     ↓
Codec Decoder
     ↓
Per-User DSP (EQ → pan → fader)
     ↓
Mix Bus (solo/mute logic)
     ↓
Master Fader → Output
     ↓
Audio Recorder (optional FLAC/WAV mix-down)
```

---

## License

MIT — see [LICENSE](LICENSE).
