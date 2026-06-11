// auth.js — token gate for Advanced C# & .NET for Newbies
// Tokens are issued after purchase.
(function () {
  var SESSION_KEY   = 'acsn_auth';
  var EXPIRY_KEY    = 'acsn_auth_expiry';
  var TTL_MS        = 24 * 60 * 60 * 1000; // 24 hours
  var VERIFY_URL    = 'https://ushahembashir.vercel.app/api/book/verify';
  var DEFAULT_TOKEN = 'xxxx';

  // Compute relative path from the current page back to the root index.html
  function indexPath() {
    var parts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
    var depth = parts.length > 0 ? parts.length - 1 : 0;
    return depth > 0 ? '../'.repeat(depth) + 'index.html' : 'index.html';
  }

  // Clear expired session
  var expiry = parseInt(localStorage.getItem(EXPIRY_KEY), 10);
  if (expiry && Date.now() > expiry) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }

  // Already authenticated — schedule auto-logout and continue
  if (localStorage.getItem(SESSION_KEY) === '1') {
    var remaining = expiry - Date.now();
    if (remaining > 0) {
      setTimeout(function () {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        window.location.replace(indexPath());
      }, remaining);
    }
    return;
  }

  // Protect every page except index
  var path = window.location.pathname;
  var onIndex = path === '/' || path === '' || path.endsWith('/index.html');
  if (!onIndex) {
    window.location.replace(indexPath());
    return;
  }

  // ── Inject overlay styles ──────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#auth-overlay {',
    '  position: fixed; inset: 0; z-index: 9999;',
    '  background: rgba(10, 5, 20, 0.97);',
    '  display: flex; align-items: center; justify-content: center;',
    '  font-family: system-ui, -apple-system, sans-serif;',
    '}',
    '#auth-box {',
    '  background: #1c1917; border-radius: 14px; padding: 2.5rem 2rem;',
    '  width: 100%; max-width: 380px; text-align: center;',
    '  box-shadow: 0 30px 70px rgba(0,0,0,0.55);',
    '}',
    '#auth-book-label {',
    '  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;',
    '  text-transform: uppercase; color: #78716c; margin-bottom: 1.25rem;',
    '}',
    '#auth-box h2 {',
    '  color: #f5f5f4; margin: 0 0 0.4rem; font-size: 1.4rem; font-weight: 700;',
    '}',
    '#auth-box .auth-sub {',
    '  color: #a8a29e; margin: 0 0 1.75rem; font-size: 0.875rem; line-height: 1.5;',
    '}',
    '#auth-box .auth-sub a {',
    '  color: #a78bfa; text-decoration: none;',
    '}',
    '#auth-box .auth-sub a:hover { text-decoration: underline; }',
    '#auth-form { display: flex; flex-direction: column; gap: 0.75rem; }',
    '#auth-token-wrap { position: relative; }',
    '#auth-input {',
    '  width: 100%; padding: 0.75rem 2.75rem 0.75rem 1rem; border-radius: 8px;',
    '  border: 1.5px solid #44403c; background: #0c0a09; color: #f5f5f4;',
    '  font-size: 0.875rem; font-family: monospace; outline: none;',
    '  box-sizing: border-box; transition: border-color 0.2s;',
    '}',
    '#auth-input:focus { border-color: #7c3aed; }',
    '#auth-toggle {',
    '  position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%);',
    '  background: none; border: none; cursor: pointer; padding: 0.25rem;',
    '  color: #78716c; display: flex; align-items: center; transition: color 0.15s;',
    '}',
    '#auth-toggle:hover { color: #a8a29e; }',
    '#auth-form button[type="submit"] {',
    '  padding: 0.75rem; border-radius: 8px; border: none;',
    '  background: #6d28d9; color: #fff; font-size: 1rem;',
    '  font-weight: 700; cursor: pointer; transition: background 0.15s, opacity 0.15s;',
    '}',
    '#auth-form button[type="submit"]:disabled {',
    '  opacity: 0.6; cursor: not-allowed;',
    '}',
    '#auth-form button[type="submit"]:not(:disabled):hover { background: #4c1d95; }',
    '#auth-error {',
    '  color: #f87171; font-size: 0.82rem; margin: 0.6rem 0 0; min-height: 1.1em;',
    '}',
    '#auth-error a { color: #f87171; text-decoration: underline; }',
  ].join('\n');
  document.head.appendChild(style);

  // ── Build overlay HTML ─────────────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.innerHTML =
    '<div id="auth-box">' +
      '<div id="auth-book-label">Advanced C# &amp; .NET for Newbies</div>' +
      '<h2>Enter Access Token</h2>' +
      '<p class="auth-sub">' +
        'Paste the token from your purchase email.<br>' +
        'Don\'t have one? <a href="https://ushahembashir.vercel.app/book" target="_blank">Get the book →</a>' +
      '</p>' +
      '<form id="auth-form">' +
        '<div id="auth-token-wrap">' +
          '<input type="password" id="auth-input" placeholder="acsn_••••••••••••••••" autocomplete="off" spellcheck="false" />' +
          '<button type="button" id="auth-toggle" aria-label="Toggle token visibility">' +
            '<svg id="auth-eye-show" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' +
            '</svg>' +
            '<svg id="auth-eye-hide" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">' +
              '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
              '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
              '<line x1="1" y1="1" x2="23" y2="23"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<button type="submit" id="auth-submit">Unlock</button>' +
      '</form>' +
      '<p id="auth-error"></p>' +
    '</div>';

  // ── Wire up behaviour ──────────────────────────────────────────────────────
  function attachOverlay() {
    document.body.appendChild(overlay);

    var input   = document.getElementById('auth-input');
    var form    = document.getElementById('auth-form');
    var submit  = document.getElementById('auth-submit');
    var error   = document.getElementById('auth-error');
    var toggle  = document.getElementById('auth-toggle');
    var eyeShow = document.getElementById('auth-eye-show');
    var eyeHide = document.getElementById('auth-eye-hide');

    toggle.addEventListener('click', function () {
      var visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      eyeShow.style.display = visible ? '' : 'none';
      eyeHide.style.display = visible ? 'none' : '';
      input.focus();
    });

    input.focus();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var token = input.value.trim();
      if (!token) {
        error.textContent = 'Please enter your access token.';
        return;
      }

      // Allow default token without hitting the API
      if (token === DEFAULT_TOKEN) {
        localStorage.setItem(SESSION_KEY, '1');
        localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
        overlay.remove();
        return;
      }

      // Validate token against the API
      error.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Verifying…';

      fetch(VERIFY_URL + '?token=' + encodeURIComponent(token))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.valid) {
            localStorage.setItem(SESSION_KEY, '1');
            localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
            overlay.remove();
          } else {
            error.innerHTML =
              'Invalid or unrecognised token. ' +
              '<a href="https://ushahembashir.vercel.app/book" target="_blank">Buy the book</a> to get one.';
            input.value = '';
            input.focus();
            submit.disabled = false;
            submit.textContent = 'Unlock';
          }
        })
        .catch(function () {
          error.textContent = 'Could not verify token. Check your connection and try again.';
          submit.disabled = false;
          submit.textContent = 'Unlock';
        });
    });
  }

  if (document.body) {
    attachOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', attachOverlay);
  }
})();
