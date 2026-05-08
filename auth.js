// auth.js — password gate for Advanced C# & .NET for Newbies
(function () {
  var SESSION_KEY  = 'acsn_auth';
  var EXPIRY_KEY   = 'acsn_auth_expiry';
  var TTL_MS       = 24 * 60 * 60 * 1000;
  var CORRECT_PASSWORD = 'Password123@';

  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var rootURL = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);

  var expiry = parseInt(localStorage.getItem(EXPIRY_KEY), 10);
  if (expiry && Date.now() > expiry) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }

  if (localStorage.getItem(SESSION_KEY) === '1') {
    var remaining = expiry - Date.now();
    if (remaining > 0) {
      setTimeout(function () {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        window.location.replace(rootURL + 'index.html');
      }, remaining);
    }
    return;
  }

  var path = window.location.pathname;
  var onIndex =
    path === '/' ||
    path === '' ||
    path.endsWith('/index.html');

  if (!onIndex) {
    window.location.replace(rootURL + 'index.html');
    return;
  }

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
    '  width: 100%; max-width: 360px; text-align: center;',
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
    '  color: #a8a29e; margin: 0 0 1.75rem; font-size: 0.875rem;',
    '}',
    '#auth-form { display: flex; flex-direction: column; gap: 0.75rem; }',
    '#auth-pw-wrap { position: relative; }',
    '#auth-input {',
    '  width: 100%; padding: 0.75rem 2.75rem 0.75rem 1rem; border-radius: 8px;',
    '  border: 1.5px solid #44403c; background: #0c0a09; color: #f5f5f4;',
    '  font-size: 1rem; outline: none; box-sizing: border-box; transition: border-color 0.2s;',
    '}',
    '#auth-input:focus { border-color: #6d28d9; }',
    '#auth-pw-toggle {',
    '  position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%);',
    '  background: none; border: none; cursor: pointer; padding: 0.25rem;',
    '  color: #78716c; display: flex; align-items: center; transition: color 0.15s;',
    '}',
    '#auth-pw-toggle:hover { color: #a8a29e; }',
    '#auth-form button[type="submit"] {',
    '  padding: 0.75rem; border-radius: 8px; border: none;',
    '  background: #6d28d9; color: #fff; font-size: 1rem;',
    '  font-weight: 600; cursor: pointer; transition: background 0.15s;',
    '}',
    '#auth-form button[type="submit"]:hover { background: #4c1d95; }',
    '#auth-error {',
    '  color: #f87171; font-size: 0.82rem; margin: 0.6rem 0 0; min-height: 1.1em;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.innerHTML =
    '<div id="auth-box">' +
      '<div id="auth-book-label">Advanced C# &amp; .NET for Newbies</div>' +
      '<h2>Enter Password</h2>' +
      '<p class="auth-sub">This content is password-protected.</p>' +
      '<form id="auth-form">' +
        '<div id="auth-pw-wrap">' +
          '<input type="password" id="auth-input" placeholder="Password" autocomplete="current-password" />' +
          '<button type="button" id="auth-pw-toggle" aria-label="Toggle password visibility">' +
            '<svg id="auth-eye-show" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
              '<circle cx="12" cy="12" r="3"/>' +
            '</svg>' +
            '<svg id="auth-eye-hide" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">' +
              '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
              '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
              '<line x1="1" y1="1" x2="23" y2="23"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<button type="submit">Unlock</button>' +
      '</form>' +
      '<p id="auth-error"></p>' +
    '</div>';

  function attachOverlay() {
    document.body.appendChild(overlay);

    var input   = document.getElementById('auth-input');
    var form    = document.getElementById('auth-form');
    var error   = document.getElementById('auth-error');
    var toggle  = document.getElementById('auth-pw-toggle');
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
      if (input.value === CORRECT_PASSWORD) {
        localStorage.setItem(SESSION_KEY, '1');
        localStorage.setItem(EXPIRY_KEY, Date.now() + TTL_MS);
        overlay.remove();
      } else {
        error.textContent = 'Incorrect password. Please try again.';
        input.value = '';
        input.focus();
      }
    });
  }

  if (document.body) {
    attachOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', attachOverlay);
  }
})();
