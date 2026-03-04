# Forus Changelog

## Bug Fix Pass — v0.1.1

### Fixes

1. **Fixed engine restart IPC handler duplication** (`src/main/main.js`)
   - **Root cause:** After an engine crash-and-restart, `registerIpcHandlers` was called again inside the `setTimeout` of the `exit` event handler. Because `ipcMain.handle()` throws if a handler is already registered for a given channel, this caused an unhandled exception on every engine restart.
   - **Fix:** Removed the redundant `registerIpcHandlers(mainWindow, engineProcess)` call from the engine exit handler's restart callback. The existing handlers already use `sendToEngine`, which reads the module-scoped `engineProcess` variable. Since `spawnEngine()` reassigns that variable, all handlers automatically route to the newly spawned process without re-registration.

2. **Fixed tray IPC channels not in preload allowlist** (`src/main/tray.js`, `src/main/preload.js`, `src/shared/constants.js`, `src/renderer/renderer-bridge.js`)
   - **Root cause:** `tray.js` sent `'tray:mute-toggled'` and `'tray:deafen-toggled'` as hardcoded string literals via `mainWindow.webContents.send()`, but neither channel was listed in `ALLOWED_LISTEN_CHANNELS` in `preload.js`. The preload guard silently blocked them, so tray mute/deafen toggles had no effect in the renderer.
   - **Fix:**
     - Added `TRAY_MUTE_TOGGLED: 'tray:mute-toggled'` and `TRAY_DEAFEN_TOGGLED: 'tray:deafen-toggled'` to `IPC_CHANNELS` in `constants.js`.
     - Added both channels to `ALLOWED_LISTEN_CHANNELS` in `preload.js`.
     - Updated `tray.js` to import `IPC_CHANNELS` from `constants.js` and use the constants instead of hardcoded strings.
     - Added `syncMuteState` and `syncDeafenState` DOM helpers to `renderer-bridge.js`, and registered listeners for both channels so the renderer UI stays in sync with tray state changes.

3. **Removed unused `session` import** (`src/main/ipc-handlers.js`)
   - **Root cause:** Line 17 imported `session` from `'electron'` but it was never referenced anywhere in the file, generating a linter warning and unnecessary module overhead.
   - **Fix:** Changed `const { ipcMain, app, session } = require('electron')` to `const { ipcMain, app } = require('electron')`.

4. **Created missing LICENSE file** (`LICENSE`)
   - **Root cause:** `README.md` referenced "MIT — see LICENSE file (not yet created)" but no `LICENSE` file existed in the repository.
   - **Fix:** Created a standard MIT License file with copyright year 2026 and author "Forus Audio".

5. **Fixed dev.js ASCII banner alignment** (`scripts/dev.js`)
   - **Root cause:** The two inner banner lines had inconsistent left-padding (10 spaces on line 2 vs. 2 spaces on line 3), making the text appear left-shifted on one line relative to the other despite equal string lengths.
   - **Fix:** Rebalanced both text lines to be visually centered within the 54-character inner width of the box, resulting in uniform left and right margins.

6. **Fixed auto-updater IPC channels not in preload allowlist** (`src/main/auto-updater.js`, `src/main/preload.js`, `src/shared/constants.js`, `src/renderer/renderer-bridge.js`)
   - **Root cause:** `auto-updater.js` sent six channels (`updater:checking`, `updater:update-available`, `updater:up-to-date`, `updater:download-progress`, `updater:update-downloaded`, `updater:error`) as hardcoded strings via `mainWindow.webContents.send()`. None of these channels were in `ALLOWED_LISTEN_CHANNELS`, so the preload bridge silently dropped every updater event — the renderer never received update notifications.
   - **Fix:**
     - Added all six updater channels to `IPC_CHANNELS` in `constants.js` under the `UPDATER_*` namespace.
     - Added all six channels to `ALLOWED_LISTEN_CHANNELS` in `preload.js`.
     - Updated `auto-updater.js` to import `IPC_CHANNELS` from `constants.js` and use constants instead of hardcoded strings.
     - Added listeners for all six updater events in `renderer-bridge.js` that log appropriately and surface actionable events (`update-available`, `update-downloaded`) as toast notifications.

7. **Removed duplicate build config from package.json** (`package.json`)
   - **Root cause:** Both `package.json` (under the `"build"` key) and `electron-builder.yml` contained identical electron-builder configuration. `electron-builder.yml` takes precedence when both are present, making the `package.json` copy a silent dead letter that could cause confusion during maintenance.
   - **Fix:** Removed the entire `"build"` key from `package.json`. `electron-builder.yml` is now the single canonical source of build configuration.

---

## Notes

- Bugs 4, 5, and 6 from the code review were assessed as non-bugs:
  - **Bug 4** (`app.isQuitting` custom property): Setting a property on the `app` object before checking it is the standard Electron pattern for clean shutdown. No fix needed.
  - **Bug 5** (WAV header byte counting): `_bytesWritten` correctly accumulates header + audio bytes; `dataSize = _bytesWritten - 44` correctly yields audio-only byte count. No fix needed.
  - **Bug 6** (CSP `script-src 'self'`): Google Fonts are loaded via `<link>` (governed by `style-src`), not `<script>`, so the strict `script-src 'self'` does not block them. No fix needed.
