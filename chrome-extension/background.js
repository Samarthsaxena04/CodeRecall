/**
 * CodeRecall — Background Service Worker
 * Handles: badge count updates, periodic due-check alarms, token helpers.
 */

const API_URLS = {
  production: 'https://coderecall-api-fthwgyg8duh7e7dk.southeastasia-01.azurewebsites.net',
  local: 'http://127.0.0.1:8000'
};

// ── Helpers ─────────────────────────────────────────────────────────────
async function getApiUrl() {
  const { apiMode } = await chrome.storage.local.get('apiMode');
  return apiMode === 'local' ? API_URLS.local : API_URLS.production;
}

async function getToken() {
  const { token } = await chrome.storage.local.get('token');
  return token || null;
}

async function apiGet(path) {
  const [baseUrl, token] = await Promise.all([getApiUrl(), getToken()]);
  if (!token) return null;

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      const refreshed = await tryRefreshToken();
      if (!refreshed) return null;
      const newToken = await getToken();
      const retryRes = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      if (!retryRes.ok) return null;
      return retryRes.json();
    }

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function tryRefreshToken() {
  const { refreshToken } = await chrome.storage.local.get('refreshToken');
  if (!refreshToken) return false;

  try {
    const baseUrl = await getApiUrl();
    const res = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) {
      await chrome.storage.local.remove(['token', 'refreshToken', 'userName']);
      return false;
    }

    const data = await res.json();
    await chrome.storage.local.set({
      token: data.access_token,
      refreshToken: data.refresh_token,
      userName: data.name
    });
    return true;
  } catch {
    return false;
  }
}

// ── Badge ───────────────────────────────────────────────────────────────
async function updateBadge() {
  const data = await apiGet('/questions/revise');
  if (!data) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const count = Array.isArray(data) ? data.length : 0;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  chrome.action.setBadgeTextColor({ color: '#ffffff' });
}

// ── Alarms ──────────────────────────────────────────────────────────────
chrome.alarms.create('checkDueQuestions', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkDueQuestions') {
    updateBadge();
  }
});

// ── Install / Startup ───────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// ── Message handler (popup/content can request badge refresh) ───────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'refreshBadge') {
    updateBadge().then(() => sendResponse({ ok: true }));
    return true; // async
  }
  if (msg.type === 'getApiUrl') {
    getApiUrl().then((url) => sendResponse({ url }));
    return true;
  }
});

// ── External message handler (receives tokens from the website auth page) ─
// The website calls chrome.runtime.sendMessage(extId, payload) after Google
// sign-in. This arrives here (not in popup.js) because:
//   1. background.js is always alive — popup closes when it loses focus
//   2. External messages fire onMessageExternal, not onMessage
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'extensionAuthSuccess') return;

  // Only accept from our own website
  const allowedOrigin = 'https://code-recall-six.vercel.app';
  if (!sender.origin || sender.origin !== allowedOrigin) return;

  chrome.storage.local.set({
    token: msg.access_token,
    refreshToken: msg.refresh_token,
    userName: msg.name,
  }).then(() => {
    updateBadge();
    sendResponse({ ok: true });
  });

  return true; // async
});
