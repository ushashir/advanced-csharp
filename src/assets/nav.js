// Shared navigation and interactive helpers
// Advanced C# & .NET for Newbies

(function () {
  // ---- Dark mode (applied before paint to prevent flash) ----
  var savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'dark-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
  toggleBtn.textContent = savedTheme === 'dark' ? '☀ Light Mode' : '☾ Dark Mode';

  var sidebarHeader = document.querySelector('.sidebar-header');
  if (sidebarHeader) {
    sidebarHeader.appendChild(toggleBtn);
    toggleBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggleBtn.textContent = next === 'dark' ? '☀ Light Mode' : '☾ Dark Mode';
    });
  }

  // ---- Mobile menu toggle ----
  const btn = document.querySelector('.menu-btn');
  const sidebar = document.querySelector('.sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && e.target !== btn) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ---- Mark active link ----
  const links = document.querySelectorAll('.sidebar nav a');
  const current = window.location.pathname.replace(/\/$/, '');
  links.forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const resolved = new URL(href, window.location.href).pathname.replace(/\/$/, '');
    if (resolved === current) a.classList.add('active');
  });

  // ---- Check answer helper ----
  window.checkAnswer = function (inputId, outputId, expected) {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    if (!input || !output) return;

    const val = input.value.trim();
    if (val.toLowerCase() === expected.toLowerCase()) {
      output.textContent = '✓ Correct! ' + (arguments[3] || 'Great job!');
      output.className = 'exercise-output success';
    } else {
      output.textContent = '✗ Not quite. Try again!';
      output.className = 'exercise-output error';
    }
  };
})();
