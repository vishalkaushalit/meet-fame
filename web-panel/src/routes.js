export const adminPages = {
  overview: 'overview',
  approvals: 'approvals',
  bookings: 'bookings',
  slots: 'availability',
  announcements: 'announcements',
  conversations: 'conversations',
};
export function adminPath(page, base = import.meta.env?.BASE_URL || '/') {
  const prefix = base.endsWith('/') ? base : base + '/';
  return page ? prefix + adminPages[page] : prefix;
}
export function matchAdminPage(path, base = import.meta.env?.BASE_URL || '/') {
  const prefix = base.endsWith('/') ? base : base + '/';
  if (path === prefix || path === prefix.slice(0, -1)) return 'login';
  if (!path.startsWith(prefix)) return null;
  const slug = path.slice(prefix.length).replace(/\/+$/, '');
  return (
    Object.keys(adminPages).find((page) => adminPages[page] === slug) || null
  );
}
export function navigateAdmin(page, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState'](
    {},
    '',
    adminPath(page),
  );
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
