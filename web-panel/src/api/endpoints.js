export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');
const id = (value) => encodeURIComponent(value);

export const ADMIN_LOGIN_API = '/auth/login';
export const CURRENT_ADMIN_API = '/auth/me';
export const ADMIN_PROFILE_API = '/admin/profile';
export const ANNOUNCEMENTS_API = '/admin/announcements';
export const ADMIN_STATS_API = '/admin/stats';
export const ACCOUNTS_API = '/admin/accounts';
export const ACCOUNT_DETAILS_API = (role, value) =>
  `/admin/accounts/${id(role)}/${id(value)}`;
export const ADMIN_INFLUENCERS_API = '/admin/influencers';
export const INFLUENCER_STATUS_API = (value) =>
  `/admin/influencers/${id(value)}/status`;
export const VERIFY_CERTIFICATE_API = (value) =>
  `/admin/influencers/${id(value)}/verify-certificate`;
export const SLOTS_OVERVIEW_API = (value) =>
  `/admin/influencers/${id(value)}/slots-overview`;
export const ADMIN_USERS_API = '/admin/users';
export const USER_STATUS_API = (value) => `/admin/users/${id(value)}/status`;
export const ADMIN_BOOKINGS_API = '/admin/bookings';
export const CONVERSATIONS_API = '/admin/conversations';

export const ANNOUNCEMENT_DETAILS_API = (announcementId) =>
  `/admin/announcements/${id(announcementId)}`;
