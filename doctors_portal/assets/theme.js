/* Match the React theme on the same origin; standalone PHP hosts retain their own choice. */
(() => {
  const storageKey = 'aura-theme';
  let theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  try { const saved = localStorage.getItem(storageKey); if (saved === 'light' || saved === 'dark') theme = saved; } catch { /* Storage can be disabled. */ }
  const apply = value => {
    theme = value;
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.textContent = value === 'dark' ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', 'Switch to ' + (value === 'dark' ? 'light' : 'dark') + ' mode');
    });
  };
  apply(theme);
  document.addEventListener('DOMContentLoaded', () => {
    apply(theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      apply(theme === 'dark' ? 'light' : 'dark');
      try { localStorage.setItem(storageKey, theme); } catch { /* The current page still changes. */ }
    }));
  });
  window.addEventListener('storage', event => { if (event.key === storageKey && ['light', 'dark'].includes(event.newValue)) apply(event.newValue); });
})();
