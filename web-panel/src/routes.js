export const adminPages = {
  overview: 'overview',
  approvals: 'approvals',
  bookings: 'bookings',
  slots: 'availability',
  announcements: 'announcements',
  conversations: 'conversations',
  'edit-profile': 'profile/edit',
  'add-announcement': 'announcements/new',
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
  if (matchAccountDetails(path, base)) return 'account-details';
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


export function matchAccountDetails(path, base = import.meta.env?.BASE_URL || '/') {
  const prefix = base.endsWith('/') ? base : base + '/';
  if (!path.startsWith(prefix)) return null;
  const match = /^accounts\/(admin|user|influencer)\/([^/]+)\/?$/.exec(path.slice(prefix.length));
  if (!match) return null;
  try { return { role: match[1], id: decodeURIComponent(match[2]) }; }
  catch { return null; }
}

export function navigateAccountDetails(account) {
  const from = matchAdminPage(window.location.pathname);
  const parent = Object.hasOwn(adminPages, from) ? from : 'approvals';
  const base = adminPath(null);
  window.history.pushState({}, '', `${base}accounts/${encodeURIComponent(account.role)}/${encodeURIComponent(account.id)}?from=${parent}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function accountDetailsParent(search = window.location.search) {
  const from = new URLSearchParams(search).get('from');
  return Object.hasOwn(adminPages, from) ? from : 'approvals';
}


export function navigateAdminAction(page) {
  const current = matchAdminPage(window.location.pathname);
  const from = Object.hasOwn(adminPages, current) ? current : accountDetailsParent();
  window.history.pushState({}, '', `${adminPath(page)}?from=${encodeURIComponent(from)}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
