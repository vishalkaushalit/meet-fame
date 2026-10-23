const KEY = 'meetfame_theme';
export function getTheme() {
  let saved;
  try {
    saved = localStorage.getItem(KEY);
  } catch {}
  return saved === 'light' || saved === 'dark'
    ? saved
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
}
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  applyTheme(theme);
  window.dispatchEvent(new Event('meetfame-theme-change'));
}
export function initializeTheme() {
  applyTheme(getTheme());
  window.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) {
      applyTheme(getTheme());
      window.dispatchEvent(new Event('meetfame-theme-change'));
    }
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyTheme(getTheme());
      window.dispatchEvent(new Event('meetfame-theme-change'));
    });
}
