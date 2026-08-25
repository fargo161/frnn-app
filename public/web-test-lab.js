(() => {
  'use strict';

  const STATUS_URL = '/api/test-lab/status';
  const STATUS_INTERVAL_MS = 3000;
  const byId = id => document.getElementById(id);

  function setState(element, value, className) {
    element.textContent = value;
    element.className = className;
  }

  function setLink(element, url) {
    element.textContent = url;
    element.href = url;
  }

  function renderLanUrls(urls) {
    const container = byId('lanBroadcastUrls');
    container.replaceChildren();
    if (!urls.length) {
      container.textContent = 'No private LAN IPv4 address was found. Laptop use still works; phone access is unavailable until the network issue is resolved.';
      byId('qrPanel').classList.add('hidden');
      byId('receiverQr').removeAttribute('src');
      byId('qrTarget').textContent = '';
      return;
    }

    for (const [index, url] of urls.entries()) {
      const row = document.createElement('div');
      row.className = 'lan-url';
      const link = document.createElement('a');
      link.id = `lanBroadcastUrl${index}`;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = url;
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'copy-button';
      copy.dataset.copyTarget = link.id;
      copy.textContent = 'Copy';
      row.append(link, copy);
      container.appendChild(row);
    }

    byId('receiverQr').src = '/api/test-lab/receiver-qr.svg';
    byId('qrTarget').textContent = urls[0];
    byId('qrPanel').classList.remove('hidden');
  }

  function renderBroadcast(broadcast) {
    const onAir = broadcast?.status === 'on_air';
    setState(byId('broadcastState'), onAir ? 'ON AIR' : 'OFF AIR', onAir ? 'on-air' : 'off-air');
    byId('activeTitle').textContent = onAir ? broadcast.current_program.title : 'CHANNEL STANDBY';
    byId('activeItemId').textContent = onAir ? String(broadcast.current_program_id) : '—';
    byId('activePlayback').textContent = onAir
      ? String(broadcast.current_program.program_type || 'test_card').toUpperCase()
      : '—';
    byId('broadcastServerTime').textContent = broadcast?.server_time || '—';
  }

  function renderStatus(payload) {
    if (!payload || payload.server !== 'ready' || payload.database !== 'ready' || !payload.urls || !payload.broadcast) {
      throw new Error('INVALID_TEST_LAB_STATUS');
    }
    setState(byId('serverState'), 'READY', 'ready');
    setState(byId('databaseState'), 'READY', 'ready');
    setLink(byId('localBroadcastUrl'), payload.urls.local_broadcast);
    renderLanUrls(payload.urls.lan_broadcasts || []);
    renderBroadcast(payload.broadcast);
    byId('statusMessage').textContent = 'Test Lab, PostgreSQL, and the public Broadcast API are responding.';
    byId('statusMessage').className = 'status-message';
  }

  function renderUnavailable() {
    setState(byId('serverState'), 'UNAVAILABLE', 'unavailable');
    setState(byId('databaseState'), 'UNAVAILABLE', 'unavailable');
    setState(byId('broadcastState'), 'UNKNOWN', 'unavailable');
    byId('statusMessage').textContent = 'Test Lab status is unavailable. The preview will keep retrying; check the terminal for the startup or database error.';
    byId('statusMessage').className = 'status-message error';
  }

  async function refreshStatus() {
    try {
      const response = await fetch(STATUS_URL, {
        method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`TEST_LAB_HTTP_${response.status}`);
      renderStatus(await response.json());
    } catch {
      renderUnavailable();
    }
  }

  async function copyLink(targetId, button) {
    const target = byId(targetId);
    if (!target?.href) return;
    try {
      await navigator.clipboard.writeText(target.href);
      const prior = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = prior; }, 1500);
    } catch {
      byId('statusMessage').textContent = `Copy was blocked. Select this address manually: ${target.href}`;
      byId('statusMessage').className = 'status-message error';
    }
  }

  function reloadFrame(id) {
    const frame = byId(id);
    frame.src = frame.getAttribute('src');
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-copy-target]');
    if (button) void copyLink(button.dataset.copyTarget, button);
  });
  byId('reloadControl').addEventListener('click', () => reloadFrame('controlFrame'));
  byId('reloadBroadcast').addEventListener('click', () => reloadFrame('broadcastFrame'));

  void refreshStatus();
  setInterval(refreshStatus, STATUS_INTERVAL_MS);
})();
