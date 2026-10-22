export function authPath(role = 'user', tab = 'login') {
  const slug = ['forgot-password', 'reset-password'].includes(tab) ? tab : tab === 'register' ? 'signup' : 'login';
  return `${role === 'influencer' ? '/influencer' : ''}/${slug}`;
}
export function matchAuthRoute(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const match = /^(\/influencer)?\/(login|signup|forgot-password|reset-password)$/.exec(normalized);
  return match
    ? {
        role: match[1] ? 'influencer' : 'user',
        tab: match[2] === 'signup' ? 'register' : match[2],
      }
    : null;
}
export function navigate(path, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
