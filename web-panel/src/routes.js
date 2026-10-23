export const adminPages = {
  'forgot-password': 'forgot-password',
  'reset-password': 'reset-password',
  overview: 'overview',
  approvals: 'approvals',
  bookings: 'bookings',
  billing: 'billing',
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
  const record = matchAdminRecord(path, base);
  if (record) return record.page;
  return (
    Object.keys(adminPages).find((page) => adminPages[page] === slug) || null
  );
}
export function matchAdminRecord(
  path,
  base = import.meta.env?.BASE_URL || '/',
) {
  const prefix = base.endsWith('/') ? base : base + '/';
  if (!path.startsWith(prefix)) return null;
  const announcement = /^announcements\/(?!new\/?$)([^/]+)(\/edit)?\/?$/.exec(
    path.slice(prefix.length),
  );
  if (announcement) {
    try {
      return {
        page: 'announcements',
        id: decodeURIComponent(announcement[1]),
        edit: Boolean(announcement[2]),
      };
    } catch {
      return null;
    }
  }
  const match =
    /^(bookings|conversations|approvals\/influencers)\/([^/]+)\/?$/.exec(
      path.slice(prefix.length),
    );
  if (!match) return null;
  try {
    return {
      page: match[1] === 'approvals/influencers' ? 'approvals' : match[1],
      id: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}
export function navigateAdminRecord(page, id, { edit = false } = {}) {
  const segment = page === 'approvals' ? 'approvals/influencers' : page;
  window.history.pushState(
    {},
    '',
    `${adminPath(null)}${segment}/${encodeURIComponent(id)}${edit ? '/edit' : ''}`,
  );
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
export function navigateAdmin(page, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState'](
    { adminNavigation: !replace },
    '',
    adminPath(page),
  );
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function matchAccountDetails(
  path,
  base = import.meta.env?.BASE_URL || '/',
) {
  const prefix = base.endsWith('/') ? base : base + '/';
  if (!path.startsWith(prefix)) return null;
  const match = /^accounts\/(admin|user|influencer)\/([^/]+)\/?$/.exec(
    path.slice(prefix.length),
  );
  if (!match) return null;
  try {
    return { role: match[1], id: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

export function navigateAccountDetails(account) {
  const from = matchAdminPage(window.location.pathname);
  const parent = Object.hasOwn(adminPages, from) ? from : 'approvals';
  const base = adminPath(null);
  window.history.pushState(
    { from: parent },
    '',
    `${base}accounts/${encodeURIComponent(account.role)}/${encodeURIComponent(account.id)}`,
  );
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function accountDetailsParent(
  search,
  state = globalThis.window?.history.state,
) {
  const from =
    search === undefined
      ? state?.from
      : new URLSearchParams(search).get('from');
  if (Object.hasOwn(adminPages, from)) return from;
  return matchAdminPage(globalThis.window?.location.pathname || '') ===
    'add-announcement'
    ? 'announcements'
    : 'approvals';
}

export function cleanAdminReturnUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('from')) return;
  const from = accountDetailsParent(url.search);
  url.searchParams.delete('from');
  window.history.replaceState(
    { ...window.history.state, from },
    '',
    url.pathname + url.search + url.hash,
  );
}

export function navigateAdminAction(page) {
  const current = matchAdminPage(window.location.pathname);
  const from = Object.hasOwn(adminPages, current)
    ? current
    : accountDetailsParent();
  window.history.pushState({ from }, '', adminPath(page));
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
