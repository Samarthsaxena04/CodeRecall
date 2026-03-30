/**
 * CodeRecall — Popup Logic
 * Handles: login, add question, due revisions, tab switching
 */

// ── Config ──────────────────────────────────────────────────────────────
const API_URLS = {
  production: 'https://coderecall-api-fthwgyg8duh7e7dk.southeastasia-01.azurewebsites.net',
  local: 'http://127.0.0.1:8000'
};
const WEBSITE_URL = 'https://code-recall-six.vercel.app';

// ── State ───────────────────────────────────────────────────────────────
let currentApiUrl = API_URLS.production;

// ── DOM refs ────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const loginView   = $('#login-view');
const mainView    = $('#main-view');
const loginForm   = $('#login-form');
const loginEmail  = $('#login-email');
const loginPwd    = $('#login-password');
const loginBtn    = $('#login-btn');
const loginErr    = $('#login-error');
const addForm     = $('#add-form');
const addBtn      = $('#add-btn');
const addErr      = $('#add-error');
const addSuccess  = $('#add-success');
const userNameEl  = $('#user-name');
const logoutBtn   = $('#logout-btn');
const dueBadge    = $('#due-badge');
const dueList     = $('#due-list');
const dueLoading  = $('#due-loading');
const dueEmpty    = $('#due-empty');
const detectionBar   = $('#detection-status');
const detectionIcon  = $('#detection-icon');
const detectionText  = $('#detection-text');
const openDashboard  = $('#open-dashboard');
const openRegister   = $('#open-website-register');
const googleLoginBtn = $('#google-login-btn');

// ── API helpers ─────────────────────────────────────────────────────────
async function getApiUrl() {
  return API_URLS.production;
}

async function getToken() {
  const { token } = await chrome.storage.local.get('token');
  return token || null;
}

async function apiRequest(method, path, body = null) {
  const baseUrl = await getApiUrl();
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res = await fetch(`${baseUrl}${path}`, opts);

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = await getToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      opts.headers = headers;
      res = await fetch(`${baseUrl}${path}`, opts);
    } else {
      await doLogout();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

async function tryRefresh() {
  const { refreshToken } = await chrome.storage.local.get('refreshToken');
  if (!refreshToken) return false;
  try {
    const baseUrl = await getApiUrl();
    const res = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return false;
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

// ── Auth ────────────────────────────────────────────────────────────────
async function checkAuth() {
  const token = await getToken();
  if (!token) {
    showView('login');
    return;
  }
  // Verify token is still valid
  try {
    const profile = await apiRequest('GET', '/profile');
    await chrome.storage.local.set({ userName: profile.name });
    showView('main');
  } catch {
    showView('login');
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErr.style.display = 'none';
  setLoading(loginBtn, true);

  try {
    const data = await apiRequest('POST', '/login', {
      email: loginEmail.value.trim(),
      password: loginPwd.value,
      name: 'User'
    });

    await chrome.storage.local.set({
      token: data.access_token,
      refreshToken: data.refresh_token,
      userName: data.name,
      userId: data.user_id
    });

    showView('main');
    chrome.runtime.sendMessage({ type: 'refreshBadge' });
  } catch (err) {
    loginErr.textContent = err.message;
    loginErr.style.display = 'block';
  } finally {
    setLoading(loginBtn, false);
  }
});

async function doLogout() {
  try {
    await apiRequest('POST', '/logout');
  } catch { /* ignore */ }
  await chrome.storage.local.remove(['token', 'refreshToken', 'userName', 'userId']);
  chrome.runtime.sendMessage({ type: 'refreshBadge' });
  showView('login');
}

logoutBtn.addEventListener('click', doLogout);


async function handleGoogleLogin() {
  loginErr.style.display = 'none';
  const extId = chrome.runtime.id;
  const authUrl = `${WEBSITE_URL}/extension-auth?ext_id=${extId}`;
  // Opens the auth page — popup closes automatically after this
  await chrome.tabs.create({ url: authUrl });
}

googleLoginBtn.addEventListener('click', handleGoogleLogin);

// ── View switching ──────────────────────────────────────────────────────
async function showView(view) {
  if (view === 'login') {
    loginView.style.display = 'block';
    mainView.style.display = 'none';
  } else {
    loginView.style.display = 'none';
    mainView.style.display = 'block';
    const { userName } = await chrome.storage.local.get('userName');
    userNameEl.textContent = userName || 'User';
    detectPage();
    loadDueCount();
  }
}

// ── Tabs ────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => {
      c.classList.remove('active');
      c.style.display = 'none';
    });
    tab.classList.add('active');
    const target = $(`#tab-${tab.dataset.tab}`);
    target.style.display = 'block';
    target.classList.add('active');

    if (tab.dataset.tab === 'due') {
      loadDueRevisions();
    }
  });
});

// ── Page detection ──────────────────────────────────────────────────────
async function detectPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      setDetectionUnsupported();
      return;
    }

    // Check if we're on a supported platform by URL pattern
    const supported = isSupportedUrl(tab.url);
    if (!supported) {
      setDetectionUnsupported();
      return;
    }

    // Prefill URL and platform from tab URL
    $('#q-link').value = tab.url;
    $('#q-platform').value = supported.platform;

    // Try to get title + tags from content script
    try {
      const data = await chrome.tabs.sendMessage(tab.id, { type: 'getPageData' });
      if (data?.supported && data.title) {
        $('#q-title').value = data.title;
        if (data.platform) $('#q-platform').value = data.platform;
      }
      // Pre-fill tags if scraped
      if (data?.tags?.length) {
        $('#q-tags').value = data.tags.join(', ');
        setDetectionDetected(supported.platform, data.tags.length);
        return;
      }
    } catch {
      // Content script might not be injected yet, use page title
      const cleanTitle = cleanPageTitle(tab.title || '', supported.platform);
      if (cleanTitle) $('#q-title').value = cleanTitle;
    }

    setDetectionDetected(supported.platform);
  } catch {
    setDetectionUnsupported();
  }
}

function isSupportedUrl(url) {
  const patterns = [
    { regex: /leetcode\.com\/problems\//i,          platform: 'LeetCode' },
    { regex: /codeforces\.com\/(problemset\/problem|contest\/\d+\/problem)\//i, platform: 'Codeforces' },
    { regex: /codechef\.com\/problems\//i,          platform: 'CodeChef' },
    { regex: /hackerrank\.com\/challenges\//i,      platform: 'HackerRank' },
    { regex: /hackerearth\.com\/(practice|problem)\//i, platform: 'HackerEarth' },
    { regex: /geeksforgeeks\.org\/problems\//i,     platform: 'GeeksforGeeks' },
    { regex: /atcoder\.jp\/contests\/.*\/tasks\//i, platform: 'AtCoder' },
    { regex: /topcoder\.com\/challenges\//i,        platform: 'TopCoder' }
  ];
  for (const p of patterns) {
    if (p.regex.test(url)) return p;
  }
  return null;
}

function cleanPageTitle(title, platform) {
  const suffixes = ['LeetCode', 'Codeforces', 'CodeChef', 'HackerRank',
                    'HackerEarth', 'GeeksforGeeks', 'GFG', 'AtCoder', 'TopCoder'];
  for (const s of suffixes) {
    title = title.replace(new RegExp(`\\s*[-–—|]\\s*${s}.*$`, 'i'), '');
  }
  // Strip leading problem numbers like "A. " or "1234. "
  title = title.replace(/^\d+\.\s*/, '').replace(/^[A-Z]\d*\.\s*/, '');
  return title.trim();
}

function setDetectionDetected(platform, tagCount = 0) {
  detectionBar.className = 'detection-bar detected';
  detectionIcon.textContent = '✅';
  const tagMsg = tagCount > 0 ? `, ${tagCount} tags` : '';
  detectionText.textContent = `${platform} detected — title${tagMsg} auto-filled`;
}

function setDetectionUnsupported() {
  detectionBar.className = 'detection-bar unsupported';
  detectionIcon.textContent = '📝';
  detectionText.textContent = 'Not on a problem page — fill in manually';
}

// ── Add Question ────────────────────────────────────────────────────────
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addErr.style.display = 'none';
  addSuccess.style.display = 'none';
  setLoading(addBtn, true);

  const title = $('#q-title').value.trim();
  const link = $('#q-link').value.trim();
  const platform = $('#q-platform').value;
  const tags = $('#q-tags').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const notes = $('#q-notes').value.trim() || null;
  const status = document.querySelector('input[name="status"]:checked').value;

  if (!title || !link) {
    showError(addErr, 'Title and Link are required');
    setLoading(addBtn, false);
    return;
  }

  try {
    await apiRequest('POST', '/questions', {
      title, link, platform, notes, tags, status
    });

    addSuccess.style.display = 'block';
    // Clear form (except link/platform if still on same page)
    $('#q-title').value = '';
    $('#q-tags').value = '';
    $('#q-notes').value = '';
    document.querySelector('input[name="status"][value="done"]').checked = true;

    chrome.runtime.sendMessage({ type: 'refreshBadge' });
    setTimeout(() => { addSuccess.style.display = 'none'; }, 3000);
  } catch (err) {
    showError(addErr, err.message);
  } finally {
    setLoading(addBtn, false);
  }
});

// ── Due Revisions ───────────────────────────────────────────────────────
async function loadDueCount() {
  try {
    const data = await apiRequest('GET', '/questions/revise');
    const count = Array.isArray(data) ? data.length : 0;
    if (count > 0) {
      dueBadge.textContent = count;
      dueBadge.style.display = 'inline-block';
    } else {
      dueBadge.style.display = 'none';
    }
  } catch {
    dueBadge.style.display = 'none';
  }
}

async function loadDueRevisions() {
  dueLoading.style.display = 'block';
  dueEmpty.style.display = 'none';
  dueList.style.display = 'none';
  dueList.innerHTML = '';

  try {
    const data = await apiRequest('GET', '/questions/revise');
    const questions = Array.isArray(data) ? data : [];

    dueLoading.style.display = 'none';

    if (questions.length === 0) {
      dueEmpty.style.display = 'block';
      return;
    }

    dueList.style.display = 'block';

    for (const q of questions) {
      const card = document.createElement('div');
      card.className = 'due-card';
      card.innerHTML = `
        <div class="due-card-header">
          <div class="due-card-title">
            <a href="${escapeHtml(q.link)}" target="_blank" rel="noopener">${escapeHtml(q.title)}</a>
          </div>
          <span class="due-card-platform">${escapeHtml(q.platform)}</span>
        </div>
        ${q.tags?.length ? `
          <div class="due-card-tags">
            ${q.tags.map(t => `<span class="due-card-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="due-card-actions">
          <button class="due-action act-done" data-id="${q.question_id}" data-status="done">✅ Solved</button>
          <button class="due-action act-help" data-id="${q.question_id}" data-status="help">🆘 Help</button>
          <button class="due-action act-fail" data-id="${q.question_id}" data-status="fail">❌ Fail</button>
        </div>
      `;

      card.querySelectorAll('.due-action').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          btn.textContent = '…';
          try {
            await apiRequest('POST', `/questions/${btn.dataset.id}/revise`, {
              status: btn.dataset.status
            });
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            card.style.transition = 'all 0.25s ease';
            setTimeout(() => {
              card.remove();
              loadDueCount();
              chrome.runtime.sendMessage({ type: 'refreshBadge' });
              // Check if list is now empty
              if (dueList.children.length === 0) {
                dueList.style.display = 'none';
                dueEmpty.style.display = 'block';
              }
            }, 260);
          } catch (err) {
            btn.textContent = 'Error';
            setTimeout(() => {
              btn.textContent = btn.dataset.status === 'done' ? '✅ Solved' :
                               btn.dataset.status === 'help' ? '🆘 Help' : '❌ Fail';
              btn.disabled = false;
            }, 1500);
          }
        });
      });

      dueList.appendChild(card);
    }
  } catch (err) {
    dueLoading.style.display = 'none';
    dueEmpty.style.display = 'block';
    dueEmpty.querySelector('p').textContent = 'Failed to load revisions';
  }
}



// ── Links ───────────────────────────────────────────────────────────────
openDashboard.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: WEBSITE_URL });
});

openRegister.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${WEBSITE_URL}/login` });
});

// ── Utilities ───────────────────────────────────────────────────────────
function setLoading(btn, loading) {
  const textEl = btn.querySelector('.btn-text');
  const loadingEl = btn.querySelector('.btn-loading');
  if (loading) {
    btn.disabled = true;
    if (textEl) textEl.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'inline';
  } else {
    btn.disabled = false;
    if (textEl) textEl.style.display = 'inline';
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Init ────────────────────────────────────────────────────────────────
checkAuth();
