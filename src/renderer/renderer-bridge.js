/**
 * renderer-bridge.js — Forus Renderer ↔ Engine Bridge
 *
 * Connects the forusAPI (exposed by preload.js via contextBridge) to the
 * Forus UI prototype (app.js). Listens for engine state events from the
 * main process and updates the DOM accordingly.
 *
 * Process: Renderer
 */

(function () {
  'use strict';

  if (!window.forusAPI) {
    console.warn('[renderer-bridge] forusAPI not found on window. Engine integration will be disabled.');
    window.forusAPI = createNoOpAPI();
    return;
  }

  const api = window.forusAPI;

  console.log('[renderer-bridge] forusAPI found. Platform:', api.platform, '| Dev mode:', api.isDev);

  const channels = api.channels;

  api.onEngineMessage(channels.ENGINE_AUDIO_STATS, (stats) => { updateAudioStats(stats); });

  api.onEngineMessage(channels.ENGINE_VOICE_STATE, (payload) => {
    console.log('[renderer-bridge] Voice state:', payload);
    handleVoiceStateChange(payload);
  });

  api.onEngineMessage(channels.ENGINE_CODEC_CHANGED, (payload) => {
    console.log('[renderer-bridge] Codec changed:', payload.codec);
    updateCodecDisplay(payload);
  });

  api.onEngineMessage(channels.ENGINE_RECORDING_STARTED, (payload) => {
    console.log('[renderer-bridge] Recording started:', payload.filePath);
    setRecordingState(true, payload);
  });

  api.onEngineMessage(channels.ENGINE_RECORDING_STOPPED, (payload) => {
    console.log('[renderer-bridge] Recording stopped. Duration:', payload.duration, 's');
    setRecordingState(false, payload);
  });

  api.onEngineMessage(channels.ENGINE_ERROR, (payload) => {
    console.error('[renderer-bridge] Engine error:', payload.message);
    showEngineError(payload);
  });

  // Tray events
  api.onEngineMessage(channels.TRAY_MUTE_TOGGLED, (payload) => {
    console.log('[renderer-bridge] Tray mute toggled:', payload.muted);
    syncMuteState(payload.muted);
  });

  api.onEngineMessage(channels.TRAY_DEAFEN_TOGGLED, (payload) => {
    console.log('[renderer-bridge] Tray deafen toggled:', payload.deafened);
    syncDeafenState(payload.deafened);
  });

  // Auto-updater events
  api.onEngineMessage(channels.UPDATER_CHECKING, () => {
    console.log('[renderer-bridge] Checking for updates...');
  });

  api.onEngineMessage(channels.UPDATER_AVAILABLE, (payload) => {
    console.log('[renderer-bridge] Update available:', payload.version);
    showToast(`Update available: v${payload.version} — downloading in background.`);
  });

  api.onEngineMessage(channels.UPDATER_UP_TO_DATE, (payload) => {
    console.log('[renderer-bridge] App is up to date:', payload.version);
  });

  api.onEngineMessage(channels.UPDATER_DOWNLOAD_PROGRESS, (payload) => {
    console.log('[renderer-bridge] Download progress:', payload.percent + '%');
  });

  api.onEngineMessage(channels.UPDATER_DOWNLOADED, (payload) => {
    console.log('[renderer-bridge] Update downloaded:', payload.version);
    showToast(`Update v${payload.version} ready — restart Forus to install.`);
  });

  api.onEngineMessage(channels.UPDATER_ERROR, (payload) => {
    console.error('[renderer-bridge] Updater error:', payload.message);
  });

  window.forusBridge = {
    voiceConnect: async (channelId, serverUrl = 'wss://voice.forus.studio') => {
      console.log('[forusBridge] Connecting to voice channel:', channelId);
      try {
        const result = await api.voiceConnect(channelId, serverUrl);
        if (!result.ok) console.error('[forusBridge] voiceConnect failed:', result.error);
      } catch (e) { console.error('[forusBridge] voiceConnect exception:', e.message); }
    },
    voiceDisconnect: async () => {
      try { await api.voiceDisconnect(); } catch (e) { console.error('[forusBridge] voiceDisconnect exception:', e.message); }
    },
    setCodec: async (codec, options = {}) => {
      console.log('[forusBridge] Setting codec:', codec);
      try {
        const result = await api.setCodec(codec, options);
        if (!result.ok) console.error('[forusBridge] setCodec failed:', result.error);
      } catch (e) { console.error('[forusBridge] setCodec exception:', e.message); }
    },
    setEQ: async (userId, band, gain, freq, Q) => {
      try { await api.setEQ(userId, band, gain, freq, Q); } catch (e) { console.error('[forusBridge] setEQ exception:', e.message); }
    },
    toggleMute: async (muted) => {
      console.log('[forusBridge] Toggle mute:', muted);
      try { await api.toggleMute(muted); } catch (e) { console.error('[forusBridge] toggleMute exception:', e.message); }
    },
    toggleDeafen: async (deafened) => {
      console.log('[forusBridge] Toggle deafen:', deafened);
      try { await api.toggleDeafen(deafened); } catch (e) { console.error('[forusBridge] toggleDeafen exception:', e.message); }
    },
    startRecording: async (format = 'flac') => {
      console.log('[forusBridge] Starting recording:', format);
      try {
        const result = await api.startRecording(format);
        if (!result.ok) console.error('[forusBridge] startRecording failed:', result.error);
        return result;
      } catch (e) { console.error('[forusBridge] startRecording exception:', e.message); }
    },
    stopRecording: async () => {
      console.log('[forusBridge] Stopping recording');
      try { return await api.stopRecording(); } catch (e) { console.error('[forusBridge] stopRecording exception:', e.message); }
    },
    mixerUpdate: async (update) => {
      try { await api.mixerUpdate(update); } catch (e) { console.error('[forusBridge] mixerUpdate exception:', e.message); }
    },
    getAudioDevices: async () => {
      try {
        const result = await api.getAudioDevices();
        return result.ok ? result.data : { inputs: [], outputs: [] };
      } catch (e) { return { inputs: [], outputs: [] }; }
    },
  };

  function updateAudioStats(stats) {
    const latencyEl = document.querySelector('[data-stat="latency"]');
    if (latencyEl) {
      latencyEl.textContent = `${Math.round(stats.latencyMs)}ms`;
      const latencyParent = latencyEl.closest('.latency');
      if (latencyParent) {
        latencyParent.style.color = stats.latencyMs < 20 ? 'var(--color-success)' : stats.latencyMs < 50 ? 'var(--color-warning)' : 'var(--color-error)';
      }
    }
    const codecEl = document.querySelector('[data-stat="codec"]');
    if (codecEl) codecEl.textContent = stats.codecName || stats.codec?.toUpperCase() || '—';
    const srEl = document.querySelector('[data-stat="samplerate"]');
    if (srEl) srEl.textContent = stats.sampleRate ? `${(stats.sampleRate / 1000).toFixed(0)}kHz` : '—';
  }

  function handleVoiceStateChange(payload) {
    const { state, channelId } = payload;
    const banner = document.querySelector('.voice-connected-banner');
    if (state === 'connected' && banner) {
      banner.style.display = 'flex';
      const channelEl = banner.querySelector('.vc-channel');
      if (channelEl && channelId) channelEl.textContent = `# ${channelId}`;
    } else if (state === 'disconnected' && banner) {
      banner.style.display = 'none';
    }
  }

  function updateCodecDisplay(payload) {
    const { codec } = payload;
    document.querySelectorAll('.codec-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.codec?.toLowerCase() === codec.toLowerCase());
    });
  }

  function setRecordingState(isRecording, payload) {
    const recordBtn = document.querySelector('.record-btn');
    if (recordBtn) recordBtn.classList.toggle('recording', isRecording);
    if (!isRecording && payload.duration) showToast(`Recording saved — ${payload.duration.toFixed(1)}s`);
  }

  function showEngineError(payload) {
    showToast(`Engine error: ${payload.message}`, 'error');
  }

  function syncMuteState(muted) {
    const muteBtn = document.querySelector('[data-action="toggle-mute"]');
    if (muteBtn) {
      muteBtn.classList.toggle('active', muted);
      muteBtn.setAttribute('aria-pressed', String(muted));
    }
  }

  function syncDeafenState(deafened) {
    const deafenBtn = document.querySelector('[data-action="toggle-deafen"]');
    if (deafenBtn) {
      deafenBtn.classList.toggle('active', deafened);
      deafenBtn.setAttribute('aria-pressed', String(deafened));
    }
  }

  function showToast(message, type = 'info') {
    let toast = document.querySelector('.mix-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mix-toast';
      document.body.appendChild(toast);
    }
    if (type === 'error') {
      toast.style.borderColor = 'var(--color-error)';
      toast.style.color = 'var(--color-error)';
    } else {
      toast.style.borderColor = '';
      toast.style.color = '';
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => { toast.classList.remove('visible'); }, 3000);
  }

  api.getAppVersion().then((result) => {
    const version = result && result.ok ? result.data : null;
    if (version) {
      document.querySelectorAll('[data-app-version]').forEach((el) => { el.textContent = `v${version}`; });
    }
  }).catch(() => {});

  function createNoOpAPI() {
    const noop = () => Promise.resolve({ ok: true, data: null });
    return {
      voiceConnect: noop, voiceDisconnect: noop, setCodec: noop, setEQ: noop,
      toggleMute: noop, toggleDeafen: noop, startRecording: noop, stopRecording: noop,
      mixerUpdate: noop,
      getAudioDevices: () => Promise.resolve({ ok: true, data: { inputs: [], outputs: [] } }),
      getAppVersion: () => Promise.resolve({ ok: true, data: '0.1.0' }),
      platform: 'browser', isDev: false, channels: {},
      onEngineMessage: () => () => {}, onEngineMessageOnce: () => {},
    };
  }

  console.log('[renderer-bridge] Initialized — forusBridge available on window');

})();
