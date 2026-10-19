export function authPath(role = 'user', tab = 'login') {
  return `${role === 'influencer' ? '/influencer' : ''}/${tab === 'register' ? 'signup' : 'login'}`;
}
export function matchAuthRoute(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const match = /^(\/influencer)?\/(login|signup)$/.exec(normalized);
  return match
    ? {
        role: match[1] ? 'influencer' : 'user',
        tab: match[2] === 'signup' ? 'register' : 'login',
      }
    : null;
}
export function navigate(path, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
