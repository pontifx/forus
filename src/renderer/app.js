/* app.js — Forus Interactive Prototype */

(function () {
  'use strict';

  // ===== DATA =====
  const SERVERS = [
    {
      id: 'ah',
      name: 'Audiophile Haven',
      initials: 'AH',
      color: '#3b9ea5',
      voiceChannels: [
        { id: 'listening-room', name: 'Listening Room', quality: 'FLAC 24/96', users: 5, desc: 'Lossless listening with zero compromise' },
        { id: 'studio-a', name: 'Studio A', quality: 'FLAC 24/96', users: 2, desc: 'Live mixing and production feedback' },
        { id: 'vinyl-lounge', name: 'Vinyl Lounge', quality: 'Opus 320k', users: 1, desc: 'Turntable sessions and analog warmth' },
      ],
      textChannels: [
        { id: 'gear-talk', name: 'gear-talk' },
        { id: 'recommendations', name: 'recommendations' },
        { id: 'general', name: 'general' },
      ],
    },
    {
      id: 'vr',
      name: 'Vinyl Republic',
      initials: 'VR',
      color: '#c4841d',
      voiceChannels: [
        { id: 'turntable-room', name: 'Turntable Room', quality: 'FLAC 24/96', users: 3, desc: 'Spin sessions and stylus debates' },
        { id: 'crate-digging', name: 'Crate Digging', quality: 'Opus 320k', users: 0, desc: 'Share your latest finds' },
      ],
      textChannels: [
        { id: 'pressing-news', name: 'pressing-news' },
        { id: 'for-sale', name: 'for-sale' },
      ],
    },
    {
      id: 'sc',
      name: 'Studio Collective',
      initials: 'SC',
      color: '#7a6cbf',
      voiceChannels: [
        { id: 'mix-room', name: 'Mix Room', quality: 'FLAC 24/96', users: 4, desc: 'Collaborative mixing sessions' },
        { id: 'mastering-suite', name: 'Mastering Suite', quality: 'FLAC 32/192', users: 1, desc: 'Final stage — mastering only' },
      ],
      textChannels: [
        { id: 'feedback', name: 'feedback' },
        { id: 'plugins', name: 'plugins' },
      ],
    },
  ];

  const USERS_DATA = {
    'listening-room': [
      { name: 'WarmTubeGlow', initials: 'WT', color: '#c4841d', quality: 'FLAC 24/96', speaking: true, muted: false, deafened: false },
      { name: 'VinylCrackle', initials: 'VC', color: '#3b9ea5', quality: 'FLAC 24/96', speaking: false, muted: false, deafened: false },
      { name: 'PlanarMagnetic', initials: 'PM', color: '#5a9a3e', quality: 'FLAC 24/96', speaking: true, muted: false, deafened: false },
      { name: 'BalancedXLR', initials: 'BX', color: '#c75050', quality: 'FLAC 24/96', speaking: false, muted: true, deafened: false },
      { name: 'Class_A_Bias', initials: 'CA', color: '#7a6cbf', quality: 'FLAC 24/96', speaking: false, muted: false, deafened: true },
    ],
    'studio-a': [
      { name: 'FaderRider', initials: 'FR', color: '#c4841d', quality: 'FLAC 24/96', speaking: true, muted: false, deafened: false },
      { name: 'SideChain', initials: 'SC', color: '#3b9ea5', quality: 'FLAC 24/96', speaking: false, muted: false, deafened: false },
    ],
    'vinyl-lounge': [
      { name: 'OrtMC_Head', initials: 'OM', color: '#5a9a3e', quality: 'Opus 320k', speaking: false, muted: false, deafened: false },
    ],
    'turntable-room': [
      { name: 'CrateKing', initials: 'CK', color: '#c4841d', quality: 'FLAC 24/96', speaking: true, muted: false, deafened: false },
      { name: 'DeadWax', initials: 'DW', color: '#3b9ea5', quality: 'Opus 320k', speaking: false, muted: false, deafened: false },
      { name: '45rpm_Only', initials: '45', color: '#c75050', quality: 'FLAC 24/96', speaking: false, muted: true, deafened: false },
    ],
    'crate-digging': [],
    'mix-room': [
      { name: 'GainStage', initials: 'GS', color: '#c4841d', quality: 'FLAC 24/96', speaking: true, muted: false, deafened: false },
      { name: 'BusComp', initials: 'BC', color: '#7a6cbf', quality: 'FLAC 24/96', speaking: false, muted: false, deafened: false },
      { name: 'ParallelFX', initials: 'PF', color: '#3b9ea5', quality: 'FLAC 24/96', speaking: true, muted: false, deafened: false },
      { name: 'MidSide', initials: 'MS', color: '#5a9a3e', quality: 'Opus 320k', speaking: false, muted: false, deafened: false },
    ],
    'mastering-suite': [
      { name: 'LimiterPro', initials: 'LP', color: '#c4841d', quality: 'FLAC 32/192', speaking: false, muted: false, deafened: false },
    ],
  };

  const TEXT_MESSAGES = {
    'gear-talk': [
      { author: 'WarmTubeGlow', initials: 'WT', color: '#c4841d', time: 'Today at 11:42 PM', text: 'Just got the Schiit Bifrost 2/64 in. The multibit implementation is seriously impressive at this price point.' },
      { author: 'PlanarMagnetic', initials: 'PM', color: '#5a9a3e', time: 'Today at 11:44 PM', text: 'Nice! How does it compare to the Modi Multibit? I\'ve been considering upgrading from my Topping D50s.' },
      { author: 'BalancedXLR', initials: 'BX', color: '#c75050', time: 'Today at 11:47 PM', text: 'The Bifrost has way better staging. The D50s is clinical but the Schiit has more body in the midrange. Pair it with the HD660S2 and you\'re set.' },
      { author: 'VinylCrackle', initials: 'VC', color: '#3b9ea5', time: 'Today at 11:51 PM', text: 'Anyone tried balanced vs single-ended on the Bifrost? Is the difference worth re-cabling?' },
    ],
    'recommendations': [
      { author: 'Class_A_Bias', initials: 'CA', color: '#7a6cbf', time: 'Today at 10:15 PM', text: 'This week\'s recommendation: Nils Frahm — "All Melody". Incredible dynamic range, perfect test material for your setup.' },
      { author: 'WarmTubeGlow', initials: 'WT', color: '#c4841d', time: 'Today at 10:22 PM', text: '+1 on Nils Frahm. Also try Yosi Horikawa — "Wandering" if you want to test imaging and spatial cues.' },
    ],
    'general': [
      { author: 'VinylCrackle', initials: 'VC', color: '#3b9ea5', time: 'Today at 9:00 PM', text: 'Welcome to Audiophile Haven! Check the #gear-talk channel for the latest discussions.' },
    ],
    'pressing-news': [
      { author: 'CrateKing', initials: 'CK', color: '#c4841d', time: 'Today at 8:30 PM', text: 'Analogue Productions just announced a new batch of 45rpm reissues from the Blue Note catalog. Pre-orders go live Friday.' },
      { author: 'DeadWax', initials: 'DW', color: '#3b9ea5', time: 'Today at 8:45 PM', text: 'Finally! I\'ve been waiting for that Art Blakey pressing. QRP plant quality has been stellar lately.' },
    ],
    'for-sale': [
      { author: '45rpm_Only', initials: '45', color: '#c75050', time: 'Today at 7:15 PM', text: 'WTS: Pro-Ject Debut Carbon EVO in walnut. Includes Ortofon 2M Blue. $400 shipped CONUS. DM me.' },
    ],
    'feedback': [
      { author: 'GainStage', initials: 'GS', color: '#c4841d', time: 'Today at 11:00 PM', text: 'Dropped a rough mix in the shared folder. Looking for feedback on the low end — 40-80Hz region feels muddy on my NS-10s but clear on the Genelecs.' },
      { author: 'BusComp', initials: 'BC', color: '#7a6cbf', time: 'Today at 11:12 PM', text: 'Listened on HD800S — the low end is fine but there\'s a 3k resonance on the vocal that\'s pretty harsh. Try a narrow cut around 2.8k.' },
      { author: 'ParallelFX', initials: 'PF', color: '#3b9ea5', time: 'Today at 11:20 PM', text: 'Agreed on the 3k. Also the reverb tail on the snare might be masking the vocal transients. Try shortening the decay.' },
    ],
    'plugins': [
      { author: 'MidSide', initials: 'MS', color: '#5a9a3e', time: 'Today at 6:00 PM', text: 'FabFilter Pro-Q 4 just dropped. The new dynamic EQ bands are game-changing for mastering.' },
    ],
  };

  // ===== STATE =====
  let currentServerId = 'ah';
  let currentChannelId = 'listening-room';
  let currentChannelType = 'voice';
  let isMicMuted = false;
  let isDeafened = false;
  let currentCodec = 'flac';
  let sidebarOpen = false;

  // ===== MIX CONSOLE STATE =====
  let mixConsoleOpen = false;
  let mixRecording = false;
  let mixRecordSeconds = 0;
  let mixRecordInterval = null;
  let mixExportCodec = 'flac';
  let mixCrossfaderValue = 0.5;
  let mixCrossfaderCurve = 'smooth';

  const mixStripState = {};
  function getStripState(userName) {
    if (!mixStripState[userName]) {
      mixStripState[userName] = {
        eqHigh: 0, eqMid: 0, eqLow: 0,
        filter: 0,
        pan: 0,
        solo: false,
        mute: false,
        fader: 0.8,
        ab: 'a',
      };
    }
    return mixStripState[userName];
  }

  let masterFader = 0.8;
  let masterSolo = false;
  let masterMute = false;

  // ===== DOM REFS =====
  const app = document.getElementById('app');
  const serverList = document.getElementById('server-list');
  const channelSidebar = document.getElementById('channel-sidebar');
  const mainContent = document.getElementById('main-content');
  const userBar = document.getElementById('user-bar');
  const mobileOverlay = document.getElementById('mobile-overlay');

  function getServer() {
    return SERVERS.find(s => s.id === currentServerId);
  }

  function renderServers() {
    const html = SERVERS.map(s => `
      <button class="server-icon ${s.id === currentServerId ? 'active' : ''}"
              data-server="${s.id}" aria-label="${s.name}" title="${s.name}">
        ${s.initials}
      </button>
    `).join('') + `
      <button class="server-icon add-server" aria-label="Add Server" title="Add Server">+</button>
    `;
    serverList.innerHTML = html;

    serverList.querySelectorAll('.server-icon[data-server]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentServerId = btn.dataset.server;
        const server = getServer();
        currentChannelId = server.voiceChannels[0].id;
        currentChannelType = 'voice';
        renderAll();
        closeSidebar();
      });
    });
  }

  function renderChannels() {
    const server = getServer();
    const voiceChannelsHtml = server.voiceChannels.map(ch => {
      const users = USERS_DATA[ch.id] || [];
      const userCount = users.length;
      const userListHtml = users.length > 0 ? `<div class="channel-users">${users.map(u => `
        <div class="channel-user">
          <div class="channel-user-avatar" style="background: ${u.color};">${u.initials}</div>
          <span class="channel-user-name">${u.name}</span>
          ${u.speaking ? '<span class="channel-user-speaking">●</span>' : ''}
          ${u.muted ? '<span class="channel-user-muted">✕</span>' : ''}
          ${u.deafened ? '<span class="channel-user-deafened">⊘</span>' : ''}
        </div>
      `).join('')}</div>` : '';

      return `
        <button class="channel-item ${ch.id === currentChannelId ? 'active' : ''}"
                data-channel="${ch.id}" data-type="voice">
          <svg class="channel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          <span class="channel-name">${ch.name}</span>
          ${userCount > 0 ? `<span class="channel-meta">${userCount}</span>` : ''}
          <span class="quality-pill">${ch.quality.split(' ')[0]}</span>
        </button>
        ${userListHtml}
      `;
    }).join('');

    const textChannelsHtml = server.textChannels.map(ch => `
      <button class="channel-item ${ch.id === currentChannelId ? 'active' : ''}"
              data-channel="${ch.id}" data-type="text">
        <svg class="channel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3 14 21"/>
        </svg>
        <span class="channel-name">${ch.name}</span>
      </button>
    `).join('');

    channelSidebar.innerHTML = `
      <div class="server-header" role="button" tabindex="0">
        <h2>${server.name}</h2>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <div class="voice-connected-banner">
        <div class="vc-dot"></div>
        <span class="vc-text">Voice Connected</span>
        <span class="vc-channel">${server.voiceChannels.find(ch => ch.id === currentChannelId)?.name || 'Listening Room'}</span>
      </div>
      <div class="channel-list">
        <div class="channel-category">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          Voice Channels
        </div>
        ${voiceChannelsHtml}
        <div class="channel-category" style="margin-top: var(--space-2);">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          Text Channels
        </div>
        ${textChannelsHtml}
      </div>
    `;

    channelSidebar.querySelectorAll('.channel-item').forEach(btn => {
      btn.addEventListener('click', () => {
        currentChannelId = btn.dataset.channel;
        currentChannelType = btn.dataset.type;
        renderAll();
        closeSidebar();
      });
    });
  }

  function renderVoiceChannel() {
    const server = getServer();
    const channel = server.voiceChannels.find(ch => ch.id === currentChannelId);
    if (!channel) return;

    const users = USERS_DATA[currentChannelId] || [];

    const userCardsHtml = users.length > 0 ? users.map(u => {
      const waveformBars = Array(5).fill(0).map(() => '<div class="bar"></div>').join('');
      const statusIcons = [];
      if (u.muted) statusIcons.push(`<svg class="status-icon muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5.166"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`);
      if (u.deafened) statusIcons.push(`<svg class="status-icon deafened" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`);

      return `
        <div class="user-card">
          <div class="avatar ${u.speaking ? 'speaking' : ''}" style="background: ${u.color};">${u.initials}</div>
          <div class="waveform ${u.speaking ? 'speaking' : ''}">${waveformBars}</div>
          <div class="username">${u.name}</div>
          <div class="user-quality">${u.quality}</div>
          ${statusIcons.length > 0 ? `<div class="user-status-icons">${statusIcons.join('')}</div>` : ''}
        </div>
      `;
    }).join('') : `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-16) var(--space-8); color: var(--color-text-faint);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto var(--space-4);">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        <p style="font-size: var(--text-sm); font-weight: 500; color: var(--color-text-muted); margin-bottom: var(--space-2);">No one is here yet</p>
        <p style="font-size: var(--text-xs);">Be the first to join this channel</p>
      </div>
    `;

    const specBars = Array(12).fill(0).map(() => '<div class="spec-bar"></div>').join('');

    mainContent.innerHTML = `
      <div class="content-header">
        <button class="mobile-hamburger" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
        </button>
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        <h1>${channel.name}</h1>
        <span class="header-desc">${channel.desc}</span>
        <div class="header-spacer"></div>
        <div class="header-actions">
          <button class="mix-toggle-btn ${mixConsoleOpen ? 'active' : ''}" data-mix-toggle aria-label="Toggle Mix Console">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="4" height="16" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="18" y="2" width="4" height="18" rx="1"/>
            </svg>
            Mix
          </button>
          <button class="icon-btn" aria-label="Toggle theme" data-theme-toggle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>
      </div>
      ${mixConsoleOpen ? renderMixConsoleInner(users, channel) : `
      <div class="content-body content-fade-enter">
        <div class="user-grid">${userCardsHtml}</div>
      </div>
      <div class="audio-panel">
        <div class="audio-panel-section">
          <div class="audio-param">
            <span class="param-label">Codec</span>
            <div class="codec-selector">
              <button class="codec-option ${currentCodec === 'flac' ? 'active' : ''}" data-codec="flac">FLAC</button>
              <button class="codec-option ${currentCodec === 'opus' ? 'active' : ''}" data-codec="opus">Opus</button>
            </div>
          </div>
        </div>
        <div class="audio-panel-section">
          <div class="audio-param">
            <span class="param-label">Bitrate</span>
            <div class="bitrate-slider">
              <span class="param-value">${currentCodec === 'flac' ? '1411' : '320'} kbps</span>
              <div class="slider-track"><div class="slider-fill" style="width: ${currentCodec === 'flac' ? '100%' : '80%'}"></div></div>
            </div>
          </div>
        </div>
        <div class="audio-panel-section">
          <div class="audio-param">
            <span class="param-label">Sample Rate</span>
            <span class="param-value">${currentCodec === 'flac' ? '96 kHz' : '48 kHz'}</span>
          </div>
        </div>
        <div class="audio-panel-section">
          <div class="audio-param">
            <span class="param-label">Buffer</span>
            <span class="param-value">256 smp</span>
          </div>
        </div>
        <div class="audio-panel-section">
          <div class="spectrum-analyzer" aria-hidden="true">${specBars}</div>
        </div>
        <div class="audio-panel-section" style="margin-left: auto;">
          <div class="latency"><span class="dot"></span><span>12ms</span></div>
        </div>
      </div>
      `}
    `;

    mainContent.querySelectorAll('.codec-option').forEach(btn => {
      btn.addEventListener('click', () => { currentCodec = btn.dataset.codec; renderMainContent(); });
    });
    bindThemeToggle();
    bindHamburger();
    bindMixToggle();
    if (mixConsoleOpen) bindMixConsoleInteractions();
  }

  function renderTextChannel() {
    const server = getServer();
    const channel = server.textChannels.find(ch => ch.id === currentChannelId);
    if (!channel) return;

    const messages = TEXT_MESSAGES[currentChannelId] || [];
    const messagesHtml = messages.map(m => `
      <div class="message">
        <div class="msg-avatar" style="background: ${m.color};">${m.initials}</div>
        <div class="msg-content">
          <div class="msg-header">
            <span class="msg-author">${m.author}</span>
            <span class="msg-time">${m.time}</span>
          </div>
          <div class="msg-text">${m.text}</div>
        </div>
      </div>
    `).join('');

    mainContent.innerHTML = `
      <div class="content-header">
        <button class="mobile-hamburger" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
        </button>
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3 14 21"/>
        </svg>
        <h1>${channel.name}</h1>
        <div class="header-spacer"></div>
        <div class="header-actions">
          <button class="icon-btn" aria-label="Toggle theme" data-theme-toggle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="text-channel-view content-fade-enter">
        <div class="messages-area">${messagesHtml}</div>
        <div class="message-input-area">
          <div class="message-input-wrapper">
            <input class="message-input" type="text" placeholder="Message #${channel.name}" aria-label="Type a message">
          </div>
        </div>
      </div>
    `;

    bindThemeToggle();
    bindHamburger();
    const messagesArea = mainContent.querySelector('.messages-area');
    if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function renderMainContent() {
    if (currentChannelType === 'voice') renderVoiceChannel();
    else renderTextChannel();
  }

  function renderUserBar() {
    const micIcon = isMicMuted
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5.166"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

    const headphoneIcon = isDeafened
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`;

    userBar.innerHTML = `
      <div class="user-info">
        <div class="user-avatar" style="background: #3b9ea5;">NF</div>
        <div class="user-details">
          <div class="user-name">NullField</div>
          <div class="user-status">
            <span class="status-dot"></span>
            <span>${currentCodec === 'flac' ? 'FLAC 24/96' : 'Opus 320k'}</span>
          </div>
        </div>
      </div>
      <div class="user-controls">
        <button class="control-btn ${isMicMuted ? 'danger' : ''}" id="mic-btn" aria-label="${isMicMuted ? 'Unmute microphone' : 'Mute microphone'}">${micIcon}</button>
        <button class="control-btn ${isDeafened ? 'danger' : ''}" id="deafen-btn" aria-label="${isDeafened ? 'Undeafen' : 'Deafen'}">${headphoneIcon}</button>
        <button class="control-btn" aria-label="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    `;

    document.getElementById('mic-btn').addEventListener('click', () => {
      isMicMuted = !isMicMuted;
      renderUserBar();
    });
    document.getElementById('deafen-btn').addEventListener('click', () => {
      isDeafened = !isDeafened;
      if (isDeafened) isMicMuted = true;
      renderUserBar();
    });
  }

  function renderAll() {
    renderServers();
    renderChannels();
    renderMainContent();
    renderUserBar();
  }

  function bindThemeToggle() {
    const toggleBtn = mainContent.querySelector('[data-theme-toggle]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const current = root.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
        const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        toggleBtn.innerHTML = next === 'dark' ? sunIcon : moonIcon;
      });
    }
  }

  function bindHamburger() {
    const hamburger = mainContent.querySelector('.mobile-hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => { sidebarOpen = true; app.classList.add('sidebar-open'); });
    }
  }

  function closeSidebar() {
    sidebarOpen = false;
    app.classList.remove('sidebar-open');
  }

  if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

  function bindMixToggle() {
    const btn = mainContent.querySelector('[data-mix-toggle]');
    if (btn) {
      btn.addEventListener('click', () => { mixConsoleOpen = !mixConsoleOpen; renderMainContent(); });
    }
  }

  function formatEqDb(val) {
    if (val === 0) return '0 dB';
    return (val > 0 ? '+' : '') + val.toFixed(1) + ' dB';
  }

  function formatFilter(val) {
    if (Math.abs(val) < 0.05) return 'OFF';
    if (val < 0) {
      const freq = Math.round(20 + (1 - Math.abs(val)) * 480);
      return 'HPF ' + freq + 'Hz';
    }
    const freq = Math.round(20000 - val * 12000);
    return 'LPF ' + (freq >= 1000 ? (freq / 1000).toFixed(1) + 'k' : freq) + 'Hz';
  }

  function formatPan(val) {
    if (val === 0) return 'C';
    if (val < 0) return 'L' + Math.abs(Math.round(val));
    return 'R' + Math.round(val);
  }

  function formatFaderDb(val) {
    if (val <= 0.01) return '-\u221e dB';
    const actualDb = val <= 0.01 ? -Infinity : 20 * Math.log10(val / 0.8) * 3;
    if (actualDb <= -60) return '-\u221e dB';
    return (actualDb >= 0 ? '+' : '') + actualDb.toFixed(1) + ' dB';
  }

  function knobRotation(normalized) { return -135 + normalized * 270; }
  function eqToNormalized(db) { return (db + 12) / 24; }
  function normalizedToEq(n) { return n * 24 - 12; }
  function filterToNormalized(val) { return (val + 1) / 2; }
  function normalizedToFilter(n) { return n * 2 - 1; }
  function panToNormalized(val) { return (val + 50) / 100; }
  function normalizedToPan(n) { return n * 100 - 50; }

  function formatRecordTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function renderMixConsoleInner(users, channel) {
    if (!users || users.length === 0) {
      return `<div class="mix-console content-fade-enter"><div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--color-text-faint);padding:var(--space-8);text-align:center;"><div><p style="font-size:var(--text-sm);font-weight:500;color:var(--color-text-muted);margin-bottom:var(--space-2);">No channels to mix</p><p style="font-size:var(--text-xs);">Join a voice channel with participants to use the mixer</p></div></div></div>`;
    }

    const stripHtmlArr = users.map((u) => {
      const st = getStripState(u.name);
      const eqHighRot = knobRotation(eqToNormalized(st.eqHigh));
      const eqMidRot = knobRotation(eqToNormalized(st.eqMid));
      const eqLowRot = knobRotation(eqToNormalized(st.eqLow));
      const filterRot = knobRotation(filterToNormalized(st.filter));
      const panRot = knobRotation(panToNormalized(st.pan));
      const faderPct = st.fader * 100;
      const faderThumbPct = (1 - st.fader) * 100;

      return `
        <div class="mix-strip" data-strip-user="${u.name}">
          <div class="strip-user">
            <div class="strip-avatar" style="background:${u.color};">${u.initials}</div>
            <div class="strip-username">${u.name}</div>
          </div>
          <div class="vu-meter ${u.speaking ? 'speaking' : 'idle'}"><div class="vu-meter-fill"></div></div>
          <div class="eq-row">
            <div class="knob-group"><span class="knob-label">Hi</span><div class="knob" data-knob="eqHigh" data-user="${u.name}" style="--knob-rotation:${eqHighRot}deg;"></div><span class="knob-value" data-val-knob="eqHigh-${u.name}">${formatEqDb(st.eqHigh)}</span></div>
            <div class="knob-group"><span class="knob-label">Mid</span><div class="knob" data-knob="eqMid" data-user="${u.name}" style="--knob-rotation:${eqMidRot}deg;"></div><span class="knob-value" data-val-knob="eqMid-${u.name}">${formatEqDb(st.eqMid)}</span></div>
            <div class="knob-group"><span class="knob-label">Lo</span><div class="knob" data-knob="eqLow" data-user="${u.name}" style="--knob-rotation:${eqLowRot}deg;"></div><span class="knob-value" data-val-knob="eqLow-${u.name}">${formatEqDb(st.eqLow)}</span></div>
          </div>
          <div class="knob-group"><span class="knob-label">Filter</span><div class="knob" data-knob="filter" data-user="${u.name}" style="--knob-rotation:${filterRot}deg;"></div><span class="knob-value" data-val-knob="filter-${u.name}">${formatFilter(st.filter)}</span></div>
          <div class="knob-group"><span class="knob-label">Pan</span><div class="knob" data-knob="pan" data-user="${u.name}" style="--knob-rotation:${panRot}deg;"></div><span class="knob-value" data-val-knob="pan-${u.name}">${formatPan(st.pan)}</span></div>
          <div class="strip-buttons">
            <button class="strip-btn ${st.solo ? 'solo-active' : ''}" data-action="solo" data-user="${u.name}">S</button>
            <button class="strip-btn ${st.mute ? 'mute-active' : ''}" data-action="mute" data-user="${u.name}">M</button>
          </div>
          <div class="fader-group">
            <div class="fader-track" data-fader="${u.name}">
              <div class="fader-fill" style="height:${faderPct}%;"></div>
              <div class="fader-thumb" style="top:${faderThumbPct}%;"></div>
            </div>
            <span class="fader-value" data-val-fader="${u.name}">${formatFaderDb(st.fader)}</span>
          </div>
          <span class="strip-quality">${u.quality}</span>
          <div class="ab-indicator">
            <button class="ab-btn ${st.ab === 'a' ? 'ab-active-a' : ''}" data-ab="a" data-user="${u.name}">A</button>
            <button class="ab-btn ${st.ab === 'b' ? 'ab-active-b' : ''}" data-ab="b" data-user="${u.name}">B</button>
          </div>
        </div>
      `;
    });

    const masterFaderPct = masterFader * 100;
    const masterFaderThumbPct = (1 - masterFader) * 100;
    const masterHtml = `
      <div class="mix-strip master-strip">
        <div class="strip-user"><div class="strip-label">Master</div></div>
        <div class="vu-stereo">
          <div><div class="vu-meter speaking"><div class="vu-meter-fill"></div></div><span class="vu-label">L</span></div>
          <div><div class="vu-meter speaking"><div class="vu-meter-fill"></div></div><span class="vu-label">R</span></div>
        </div>
        <div class="fader-group">
          <div class="fader-track" data-fader="__master__">
            <div class="fader-fill" style="height:${masterFaderPct}%;"></div>
            <div class="fader-thumb" style="top:${masterFaderThumbPct}%;"></div>
          </div>
          <span class="fader-value" data-val-fader="__master__">${formatFaderDb(masterFader)}</span>
        </div>
        <button class="record-btn ${mixRecording ? 'recording' : ''}" data-action="record"><div class="rec-dot"></div></button>
        ${mixRecording ? `<span class="record-timer" data-rec-timer>${formatRecordTime(mixRecordSeconds)}</span>` : ''}
        ${mixRecording ? `<button class="stop-export-btn" data-action="stop-export">Stop &amp; Export</button>` : ''}
        <div class="master-codec">
          <button class="master-codec-option ${mixExportCodec === 'flac' ? 'active' : ''}" data-export-codec="flac">FLAC</button>
          <button class="master-codec-option ${mixExportCodec === 'wav' ? 'active' : ''}" data-export-codec="wav">WAV</button>
          <button class="master-codec-option ${mixExportCodec === 'opus' ? 'active' : ''}" data-export-codec="opus">Opus</button>
        </div>
      </div>
    `;

    const cfLeft = mixCrossfaderValue * 100;
    const crossfaderHtml = `
      <div class="crossfader-section">
        <span class="crossfader-label">X-Fade</span>
        <div class="crossfader-track-wrapper">
          <div class="crossfader-endpoints"><span>A</span><span>B</span></div>
          <div class="crossfader-track" data-crossfader><div class="crossfader-thumb" style="left:${cfLeft}%;"></div></div>
        </div>
        <div class="curve-selector">
          <button class="curve-option ${mixCrossfaderCurve === 'smooth' ? 'active' : ''}" data-curve="smooth">Smooth</button>
          <button class="curve-option ${mixCrossfaderCurve === 'sharp' ? 'active' : ''}" data-curve="sharp">Sharp</button>
          <button class="curve-option ${mixCrossfaderCurve === 'cut' ? 'active' : ''}" data-curve="cut">Cut</button>
        </div>
      </div>
    `;

    const transportHtml = `
      <div class="transport-bar">
        <div class="transport-item"><span>Codec:</span><span class="transport-value">${channel.quality}</span></div>
        <div class="transport-item"><span>Latency:</span><span class="transport-value">12ms</span></div>
        <div class="transport-item"><span>Participants:</span><span class="transport-value">${users.length}</span></div>
        ${mixRecording ? `<div class="transport-item" style="margin-left:auto;"><span class="transport-rec-dot"></span><span style="color:var(--color-error);">REC</span><span class="transport-value" data-transport-timer>${formatRecordTime(mixRecordSeconds)}</span></div>` : ''}
      </div>
    `;

    return `<div class="mix-console content-fade-enter"><div class="mix-console-body"><div class="mix-strips-container">${stripHtmlArr.join('')}${masterHtml}</div></div>${crossfaderHtml}${transportHtml}</div>`;
  }

  function bindMixConsoleInteractions() {
    const mixEl = mainContent.querySelector('.mix-console');
    if (!mixEl) return;

    mixEl.querySelectorAll('.knob[data-knob]').forEach(knobEl => {
      knobEl.addEventListener('mousedown', startKnobDrag);
      knobEl.addEventListener('touchstart', startKnobDrag, { passive: false });
    });

    function startKnobDrag(e) {
      e.preventDefault();
      const knobEl = e.currentTarget;
      const knobType = knobEl.dataset.knob;
      const userName = knobEl.dataset.user;
      const st = getStripState(userName);
      let startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      let startVal;
      if (knobType === 'eqHigh' || knobType === 'eqMid' || knobType === 'eqLow') startVal = eqToNormalized(st[knobType]);
      else if (knobType === 'filter') startVal = filterToNormalized(st.filter);
      else if (knobType === 'pan') startVal = panToNormalized(st.pan);

      function onMove(ev) {
        const clientY = ev.clientY || (ev.touches && ev.touches[0].clientY) || 0;
        const dy = startY - clientY;
        let newVal = Math.max(0, Math.min(1, startVal + dy / 150));
        if (knobType === 'eqHigh' || knobType === 'eqMid' || knobType === 'eqLow') {
          st[knobType] = Math.round(normalizedToEq(newVal) * 2) / 2;
          newVal = eqToNormalized(st[knobType]);
        } else if (knobType === 'filter') {
          st.filter = Math.round(normalizedToFilter(newVal) * 20) / 20;
          newVal = filterToNormalized(st.filter);
        } else if (knobType === 'pan') {
          st.pan = Math.round(normalizedToPan(newVal));
          newVal = panToNormalized(st.pan);
        }
        knobEl.style.setProperty('--knob-rotation', knobRotation(newVal) + 'deg');
        const valEl = mainContent.querySelector(`[data-val-knob="${knobType}-${userName}"]`);
        if (valEl) {
          if (knobType === 'eqHigh' || knobType === 'eqMid' || knobType === 'eqLow') valEl.textContent = formatEqDb(st[knobType]);
          else if (knobType === 'filter') valEl.textContent = formatFilter(st.filter);
          else if (knobType === 'pan') valEl.textContent = formatPan(st.pan);
        }
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    }

    mixEl.querySelectorAll('.fader-track[data-fader]').forEach(track => {
      track.addEventListener('mousedown', startFaderDrag);
      track.addEventListener('touchstart', startFaderDrag, { passive: false });
    });

    function startFaderDrag(e) {
      e.preventDefault();
      const track = e.currentTarget;
      const userName = track.dataset.fader;
      const isMaster = userName === '__master__';
      const rect = track.getBoundingClientRect();
      function updateFader(clientY) {
        const pct = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
        if (isMaster) masterFader = pct;
        else getStripState(userName).fader = pct;
        const fill = track.querySelector('.fader-fill');
        const thumb = track.querySelector('.fader-thumb');
        const valEl = mainContent.querySelector(`[data-val-fader="${userName}"]`);
        if (fill) fill.style.height = (pct * 100) + '%';
        if (thumb) thumb.style.top = ((1 - pct) * 100) + '%';
        if (valEl) valEl.textContent = formatFaderDb(pct);
      }
      updateFader(e.clientY || (e.touches && e.touches[0].clientY) || 0);
      function onMove(ev) { updateFader(ev.clientY || (ev.touches && ev.touches[0].clientY) || 0); }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    }

    const cfTrack = mixEl.querySelector('[data-crossfader]');
    if (cfTrack) {
      cfTrack.addEventListener('mousedown', startCrossfaderDrag);
      cfTrack.addEventListener('touchstart', startCrossfaderDrag, { passive: false });
    }

    function startCrossfaderDrag(e) {
      e.preventDefault();
      const rect = cfTrack.getBoundingClientRect();
      function updateCf(clientX) {
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        mixCrossfaderValue = pct;
        const thumb = cfTrack.querySelector('.crossfader-thumb');
        if (thumb) thumb.style.left = (pct * 100) + '%';
      }
      updateCf(e.clientX || (e.touches && e.touches[0].clientX) || 0);
      function onMove(ev) { updateCf(ev.clientX || (ev.touches && ev.touches[0].clientX) || 0); }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    }

    mixEl.querySelectorAll('.strip-btn[data-action="solo"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const st = getStripState(btn.dataset.user);
        st.solo = !st.solo;
        btn.classList.toggle('solo-active', st.solo);
      });
    });
    mixEl.querySelectorAll('.strip-btn[data-action="mute"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const st = getStripState(btn.dataset.user);
        st.mute = !st.mute;
        btn.classList.toggle('mute-active', st.mute);
      });
    });

    mixEl.querySelectorAll('.ab-btn[data-ab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ab = btn.dataset.ab;
        getStripState(btn.dataset.user).ab = ab;
        const strip = btn.closest('.mix-strip');
        if (strip) {
          strip.querySelectorAll('.ab-btn').forEach(b => {
            b.classList.remove('ab-active-a', 'ab-active-b');
            if (b.dataset.ab === ab) b.classList.add(ab === 'a' ? 'ab-active-a' : 'ab-active-b');
          });
        }
      });
    });

    const recBtn = mixEl.querySelector('[data-action="record"]');
    if (recBtn) {
      recBtn.addEventListener('click', () => {
        if (!mixRecording) {
          mixRecording = true;
          mixRecordSeconds = 0;
          mixRecordInterval = setInterval(() => {
            mixRecordSeconds++;
            const timerEls = mainContent.querySelectorAll('[data-rec-timer], [data-transport-timer]');
            timerEls.forEach(el => { el.textContent = formatRecordTime(mixRecordSeconds); });
          }, 1000);
          renderMainContent();
        } else {
          stopRecording();
        }
      });
    }

    const stopBtn = mixEl.querySelector('[data-action="stop-export"]');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        stopRecording();
        showToast('Mix exported as ' + mixExportCodec.toUpperCase() + ' \u2014 mixed_session_2026-02-28.' + mixExportCodec);
      });
    }

    mixEl.querySelectorAll('[data-export-codec]').forEach(btn => {
      btn.addEventListener('click', () => {
        mixExportCodec = btn.dataset.exportCodec;
        mixEl.querySelectorAll('[data-export-codec]').forEach(b => {
          b.classList.toggle('active', b.dataset.exportCodec === mixExportCodec);
        });
      });
    });

    mixEl.querySelectorAll('[data-curve]').forEach(btn => {
      btn.addEventListener('click', () => {
        mixCrossfaderCurve = btn.dataset.curve;
        mixEl.querySelectorAll('[data-curve]').forEach(b => {
          b.classList.toggle('active', b.dataset.curve === mixCrossfaderCurve);
        });
      });
    });
  }

  function stopRecording() {
    mixRecording = false;
    if (mixRecordInterval) { clearInterval(mixRecordInterval); mixRecordInterval = null; }
    renderMainContent();
  }

  function showToast(msg) {
    const existing = document.querySelector('.mix-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'mix-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add('visible'); });
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // ================================================================
  // DISCORD MIGRATION WIZARD
  // ================================================================

  const DISCORD_SERVERS_MOCK = [
    { id: 'ds-hf', name: 'Head-Fi Community', initials: 'HF', color: '#5865F2', members: 3421, channels: 34, roles: 22, categories: 8 },
    { id: 'ds-vh', name: 'Vinyl Heads', initials: 'VH', color: '#c4841d', members: 891, channels: 18, roles: 8, categories: 5 },
    { id: 'ds-du', name: 'DAW Users Group', initials: 'DU', color: '#5a9a3e', members: 2105, channels: 27, roles: 14, categories: 7 },
    { id: 'ds-sm', name: 'Studio Monitors Club', initials: 'SM', color: '#c75050', members: 567, channels: 12, roles: 6, categories: 3 },
    { id: 'ds-sn', name: 'Synth Nerds', initials: 'SN', color: '#7a6cbf', members: 1832, channels: 21, roles: 11, categories: 6 },
  ];

  let migrationStep = 1;
  let migrationSelectedServer = null;
  let migrationImporting = false;
  let migrationImportTimer = null;

  const migOverlay = document.getElementById('migration-overlay');
  const migContent = document.getElementById('migration-content');
  const migCloseBtn = document.getElementById('migration-close');

  const DISCORD_LOGO_SVG = `<svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.3052 54.5139 18.3604 54.4378C19.7295 52.5728 21.0178 50.6063 22.1746 48.5383C22.2323 48.4172 22.1774 48.2735 22.0517 48.2256C20.1097 47.4931 18.2584 46.6 16.5074 45.5827C16.3664 45.5006 16.3536 45.2984 16.4821 45.2007C16.8516 44.9216 17.2211 44.6318 17.5738 44.3393C17.6176 44.3027 17.6769 44.2955 17.7273 44.3196C29.1959 49.5595 41.6839 49.5595 53.0262 44.3196C53.0766 44.2927 53.1359 44.2999 53.1825 44.3365C53.5352 44.629 53.9047 44.9216 54.2771 45.2007C54.4056 45.2984 54.3956 45.5006 54.2546 45.5827C52.5036 46.6168 50.6523 47.4931 48.7075 48.2228C48.5818 48.2707 48.5297 48.4172 48.5874 48.5383C49.7672 50.6035 51.0555 52.57 52.4271 54.435C52.4799 54.5139 52.5809 54.5477 52.6733 54.5195C58.4751 52.7249 64.3577 50.0174 70.4306 45.5576C70.4838 45.5182 70.5174 45.459 70.523 45.3942C72.0059 30.0564 68.0287 16.7447 60.1949 4.9823C60.1753 4.9429 60.1417 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.2801 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/></svg>`;

  const DISCORD_ICON_SMALL = `<svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:14px;"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.3052 54.5139 18.3604 54.4378C19.7295 52.5728 21.0178 50.6063 22.1746 48.5383C22.2323 48.4172 22.1774 48.2735 22.0517 48.2256C20.1097 47.4931 18.2584 46.6 16.5074 45.5827C16.3664 45.5006 16.3536 45.2984 16.4821 45.2007C16.8516 44.9216 17.2211 44.6318 17.5738 44.3393C17.6176 44.3027 17.6769 44.2955 17.7273 44.3196C29.1959 49.5595 41.6839 49.5595 53.0262 44.3196C53.0766 44.2927 53.1359 44.2999 53.1825 44.3365C53.5352 44.629 53.9047 44.9216 54.2771 45.2007C54.4056 45.2984 54.3956 45.5006 54.2546 45.5827C52.5036 46.6168 50.6523 47.4931 48.7075 48.2228C48.5818 48.2707 48.5297 48.4172 48.5874 48.5383C49.7672 50.6035 51.0555 52.57 52.4271 54.435C52.4799 54.5139 52.5809 54.5477 52.6733 54.5195C58.4751 52.7249 64.3577 50.0174 70.4306 45.5576C70.4838 45.5182 70.5174 45.459 70.523 45.3942C72.0059 30.0564 68.0287 16.7447 60.1949 4.9823C60.1753 4.9429 60.1417 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.2801 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/></svg>`;

  const CHECK_SVG = `<svg class="mig-log-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  function openMigrationWizard() {
    migrationStep = 1;
    migrationSelectedServer = null;
    migrationImporting = false;
    migOverlay.classList.add('visible');
    migOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderMigrationStep();
    migOverlay.focus();
  }

  function closeMigrationWizard() {
    if (migrationImporting) return;
    migOverlay.classList.remove('visible');
    migOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (migrationImportTimer) { clearTimeout(migrationImportTimer); migrationImportTimer = null; }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && migOverlay.classList.contains('visible')) closeMigrationWizard();
  });

  migOverlay.addEventListener('click', (e) => { if (e.target === migOverlay) closeMigrationWizard(); });
  migCloseBtn.addEventListener('click', closeMigrationWizard);

  function updateStepper() {
    const steps = document.querySelectorAll('.migration-step');
    const connectors = document.querySelectorAll('.step-connector');
    steps.forEach((s, i) => {
      const stepNum = i + 1;
      s.classList.remove('active', 'completed');
      if (stepNum === migrationStep) s.classList.add('active');
      else if (stepNum < migrationStep) {
        s.classList.add('completed');
        s.querySelector('.step-circle').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        s.querySelector('.step-circle').textContent = stepNum;
      }
    });
    connectors.forEach((c, i) => {
      c.classList.remove('active', 'completed');
      if (i + 1 < migrationStep) c.classList.add('completed');
      else if (i + 1 === migrationStep) c.classList.add('active');
    });
  }

  function renderMigrationStep() {
    updateStepper();
    switch (migrationStep) {
      case 1: renderMigStep1(); break;
      case 2: renderMigStep2(); break;
      case 3: renderMigStep3(); break;
      case 4: renderMigStep4(); break;
    }
  }

  function renderMigStep1() {
    migContent.innerHTML = `
      <div class="mig-connect mig-step-enter">
        <div class="discord-logo">${DISCORD_LOGO_SVG}</div>
        <h2>Bring your community to Forus</h2>
        <p class="mig-subtext">Connect your Discord account to import your servers, channels, roles, and members. Your data stays yours.</p>
        <button class="mig-cta" id="mig-connect-btn">${DISCORD_ICON_SMALL} Connect with Discord</button>
        <p class="mig-fine-print">We'll request read-only access to your server list</p>
      </div>
    `;
    document.getElementById('mig-connect-btn').addEventListener('click', () => {
      migContent.innerHTML = `<div class="mig-connect mig-step-enter" style="padding-top:var(--space-16);"><div class="mig-spinner"></div><p class="mig-connecting-text">Connecting to Discord...</p></div>`;
      setTimeout(() => { migrationStep = 2; renderMigrationStep(); }, 1500);
    });
  }

  function renderMigStep2() {
    const cardsHtml = DISCORD_SERVERS_MOCK.map(s => `
      <div class="mig-server-card ${migrationSelectedServer && migrationSelectedServer.id === s.id ? 'selected' : ''}" data-mig-server="${s.id}">
        <div class="mig-srv-avatar" style="background:${s.color};">${s.initials}</div>
        <div class="mig-srv-info">
          <div class="mig-srv-name">${s.name}</div>
          <div class="mig-srv-stats">
            <span class="mig-srv-stat">${s.members.toLocaleString()} members</span>
            <span class="mig-srv-stat">${s.channels} channels</span>
            <span class="mig-srv-stat">${s.roles} roles</span>
          </div>
        </div>
        <div class="mig-radio"></div>
      </div>
    `).join('');
    migContent.innerHTML = `
      <div class="mig-select mig-step-enter">
        <h2>Select a Server</h2>
        <p class="mig-select-sub">Choose the Discord server you'd like to migrate to Forus.</p>
        <div class="mig-server-grid">${cardsHtml}</div>
        <div class="mig-nav">
          <button class="mig-btn-back" id="mig-back-2">← Back</button>
          <button class="mig-btn-next" id="mig-next-2" ${!migrationSelectedServer ? 'disabled' : ''}>Next →</button>
        </div>
      </div>
    `;
    migContent.querySelectorAll('.mig-server-card').forEach(card => {
      card.addEventListener('click', () => {
        const sid = card.dataset.migServer;
        migrationSelectedServer = DISCORD_SERVERS_MOCK.find(s => s.id === sid);
        migContent.querySelectorAll('.mig-server-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.getElementById('mig-next-2').disabled = false;
      });
    });
    document.getElementById('mig-back-2').addEventListener('click', () => { migrationStep = 1; renderMigrationStep(); });
    document.getElementById('mig-next-2').addEventListener('click', () => { if (migrationSelectedServer) { migrationStep = 3; renderMigrationStep(); } });
  }

  function renderMigStep3() {
    const s = migrationSelectedServer;
    migContent.innerHTML = `
      <div class="mig-configure mig-step-enter">
        <h2>Configure Import — ${s.name}</h2>
        <div class="mig-section">
          <div class="mig-section-header">Server Structure</div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Channels &amp; Categories</div><div class="mig-toggle-desc">${s.channels} channels in ${s.categories} categories</div></div><label class="mig-switch"><input type="checkbox" checked><span class="mig-switch-track"></span></label></div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Roles &amp; Permissions</div><div class="mig-toggle-desc">${s.roles} roles</div></div><label class="mig-switch"><input type="checkbox" checked><span class="mig-switch-track"></span></label></div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Server Settings</div><div class="mig-toggle-desc">Name, icon, description, rules</div></div><label class="mig-switch"><input type="checkbox" checked><span class="mig-switch-track"></span></label></div>
        </div>
        <div class="mig-section">
          <div class="mig-section-header">Members</div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Member List</div><div class="mig-toggle-desc">${s.members.toLocaleString()} members</div></div><label class="mig-switch"><input type="checkbox" checked><span class="mig-switch-track"></span></label></div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Message History</div><div class="mig-toggle-desc">Import all text channel messages</div><div class="mig-toggle-warning">⚠ May take several hours for large servers</div></div><label class="mig-switch"><input type="checkbox"><span class="mig-switch-track"></span></label></div>
        </div>
        <div class="mig-section">
          <div class="mig-section-header teal">Audio Upgrade</div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Upgrade voice channels to FLAC</div><div class="mig-toggle-desc">Lossless FLAC 24/96 on all voice channels</div></div><label class="mig-switch"><input type="checkbox" checked><span class="mig-switch-track"></span></label></div>
          <div class="mig-toggle-row"><div class="mig-toggle-info"><div class="mig-toggle-label">Enable Channel Mixer</div><div class="mig-toggle-desc">Per-user mixing controls on all voice channels</div></div><label class="mig-switch"><input type="checkbox" checked><span class="mig-switch-track"></span></label></div>
        </div>
        <div class="mig-estimate">Estimated time: ~2 minutes for structure</div>
        <div class="mig-nav">
          <button class="mig-btn-back" id="mig-back-3">← Back</button>
          <button class="mig-btn-next" id="mig-begin-import">Begin Import</button>
        </div>
      </div>
    `;
    document.getElementById('mig-back-3').addEventListener('click', () => { migrationStep = 2; renderMigrationStep(); });
    document.getElementById('mig-begin-import').addEventListener('click', () => { migrationStep = 4; renderMigrationStep(); });
  }

  function renderMigStep4() {
    migrationImporting = true;
    const circumference = 2 * Math.PI * 60;
    migContent.innerHTML = `
      <div class="mig-importing mig-step-enter">
        <div class="mig-progress-ring-wrap">
          <svg class="mig-progress-ring" viewBox="0 0 140 140">
            <circle class="ring-bg" cx="70" cy="70" r="60"/>
            <circle class="ring-fill" cx="70" cy="70" r="60" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" id="mig-ring-fill"/>
          </svg>
          <div class="mig-progress-pct" id="mig-pct">0%</div>
        </div>
        <div class="mig-progress-label" id="mig-progress-label">Preparing import...</div>
        <div class="mig-log" id="mig-log"></div>
      </div>
    `;

    const ringFill = document.getElementById('mig-ring-fill');
    const pctEl = document.getElementById('mig-pct');
    const labelEl = document.getElementById('mig-progress-label');
    const logEl = document.getElementById('mig-log');

    const importSteps = [
      { pct: 15, label: 'Creating server structure...' },
      { pct: 30, label: 'Mapping channels & categories...' },
      { pct: 45, label: 'Importing roles & permissions...' },
      { pct: 55, label: 'Setting up voice channels with FLAC...' },
      { pct: 65, label: 'Enabling channel mixer...' },
      { pct: 80, label: 'Sending member invitations...' },
      { pct: 90, label: 'Importing emoji & stickers...' },
      { pct: 95, label: 'Applying audio upgrades...' },
      { pct: 100, label: 'Finalizing...' },
    ];

    let currentIdx = 0, currentPct = 0;

    function getTimestamp() {
      return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function addLogEntry(text) {
      const entry = document.createElement('div');
      entry.className = 'mig-log-entry';
      entry.innerHTML = `${CHECK_SVG}<span>${text}</span><span class="mig-log-time">${getTimestamp()}</span>`;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function animateProgress() {
      if (currentIdx >= importSteps.length) {
        migrationImporting = false;
        setTimeout(() => renderMigSuccess(), 600);
        return;
      }
      const step = importSteps[currentIdx];
      labelEl.textContent = step.label;
      const targetPct = step.pct;
      const startPct = currentPct;
      const duration = 700 + Math.random() * 400;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easedT = 1 - Math.pow(1 - t, 3);
        const p = Math.round(startPct + (targetPct - startPct) * easedT);
        currentPct = p;
        pctEl.textContent = p + '%';
        ringFill.style.strokeDashoffset = circumference - (p / 100) * circumference;
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          addLogEntry(step.label.replace('...', ' — done'));
          currentIdx++;
          migrationImportTimer = setTimeout(animateProgress, 200 + Math.random() * 300);
        }
      }
      requestAnimationFrame(tick);
    }
    migrationImportTimer = setTimeout(animateProgress, 400);
  }

  function renderMigSuccess() {
    updateStepper();
    const s = migrationSelectedServer;
    migContent.innerHTML = `
      <div class="mig-success mig-step-enter">
        <div class="mig-success-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2>Your community is ready!</h2>
        <div class="mig-success-stats">
          <div class="mig-stat"><span class="mig-stat-value">${s.channels}</span><span class="mig-stat-label">Channels</span></div>
          <div class="mig-stat"><span class="mig-stat-value">${s.roles}</span><span class="mig-stat-label">Roles</span></div>
          <div class="mig-stat"><span class="mig-stat-value">${s.members.toLocaleString()}</span><span class="mig-stat-label">Invited</span></div>
          <div class="mig-stat"><span class="mig-stat-value">47</span><span class="mig-stat-label">Emoji</span></div>
        </div>
        <div class="mig-success-actions">
          <button class="mig-btn-next" id="mig-open-server">Open Server</button>
          <button class="mig-btn-ghost" id="mig-import-another">Import Another</button>
        </div>
      </div>
    `;
    document.getElementById('mig-open-server').addEventListener('click', () => { addImportedServer(s); closeMigrationWizard(); });
    document.getElementById('mig-import-another').addEventListener('click', () => { migrationStep = 1; migrationSelectedServer = null; renderMigrationStep(); });
  }

  function addImportedServer(discordServer) {
    const existingId = discordServer.id.replace('ds-', '');
    if (SERVERS.find(s => s.id === existingId)) {
      currentServerId = existingId;
      currentChannelId = SERVERS.find(s => s.id === existingId).voiceChannels[0].id;
      currentChannelType = 'voice';
      renderAll();
      return;
    }
    const newId = existingId;
    const voiceChannelId = newId + '-main';
    const textChannelId = newId + '-general';
    const newServer = {
      id: newId,
      name: discordServer.name,
      initials: discordServer.initials,
      color: discordServer.color,
      voiceChannels: [{ id: voiceChannelId, name: 'Main Stage', quality: 'FLAC 24/96', users: 0, desc: 'Migrated from Discord — lossless audio enabled' }],
      textChannels: [{ id: textChannelId, name: 'general' }],
    };
    SERVERS.push(newServer);
    USERS_DATA[voiceChannelId] = [];
    TEXT_MESSAGES[textChannelId] = [
      { author: 'Forus Bot', initials: 'FB', color: '#3b9ea5', time: 'Just now', text: `Welcome to ${discordServer.name} on Forus! Your community has been migrated with ${discordServer.channels} channels, ${discordServer.roles} roles, and ${discordServer.members.toLocaleString()} member invitations sent. Voice channels are now running FLAC 24/96 lossless audio.` },
    ];
    currentServerId = newId;
    currentChannelId = textChannelId;
    currentChannelType = 'text';
    renderAll();
  }

  // Override renderServers to include import button
  renderServers = function () {
    const serverBtns = SERVERS.map(s => `
      <button class="server-icon ${s.id === currentServerId ? 'active' : ''}" data-server="${s.id}" aria-label="${s.name}" title="${s.name}">${s.initials}</button>
    `).join('');

    const importBtn = `
      <button class="server-icon import-discord" id="import-discord-btn" aria-label="Import from Discord" title="Import from Discord">
        <svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.3052 54.5139 18.3604 54.4378C19.7295 52.5728 21.0178 50.6063 22.1746 48.5383C22.2323 48.4172 22.1774 48.2735 22.0517 48.2256C20.1097 47.4931 18.2584 46.6 16.5074 45.5827C16.3664 45.5006 16.3536 45.2984 16.4821 45.2007C16.8516 44.9216 17.2211 44.6318 17.5738 44.3393C17.6176 44.3027 17.6769 44.2955 17.7273 44.3196C29.1959 49.5595 41.6839 49.5595 53.0262 44.3196C53.0766 44.2927 53.1359 44.2999 53.1825 44.3365C53.5352 44.629 53.9047 44.9216 54.2771 45.2007C54.4056 45.2984 54.3956 45.5006 54.2546 45.5827C52.5036 46.6168 50.6523 47.4931 48.7075 48.2228C48.5818 48.2707 48.5297 48.4172 48.5874 48.5383C49.7672 50.6035 51.0555 52.57 52.4271 54.435C52.4799 54.5139 52.5809 54.5477 52.6733 54.5195C58.4751 52.7249 64.3577 50.0174 70.4306 45.5576C70.4838 45.5182 70.5174 45.459 70.523 45.3942C72.0059 30.0564 68.0287 16.7447 60.1949 4.9823C60.1753 4.9429 60.1417 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.2801 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/></svg>
        <span class="tooltip">Import from Discord</span>
      </button>
    `;

    const addBtn = `<button class="server-icon add-server" aria-label="Add Server" title="Add Server">+</button>`;
    serverList.innerHTML = serverBtns + importBtn + addBtn;

    serverList.querySelectorAll('.server-icon[data-server]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentServerId = btn.dataset.server;
        const server = getServer();
        currentChannelId = server.voiceChannels[0].id;
        currentChannelType = 'voice';
        renderAll();
        closeSidebar();
      });
    });

    const importDiscordBtn = document.getElementById('import-discord-btn');
    if (importDiscordBtn) importDiscordBtn.addEventListener('click', openMigrationWizard);
  };

  // ===== INIT =====
  document.documentElement.setAttribute('data-theme', 'dark');
  renderAll();

})();
