import { ANNOUNCEMENT_DETAILS_API } from './endpoints';
import { client } from './client';
import {
  ADMIN_LOGIN_API,
  CURRENT_ADMIN_API,
  ADMIN_PROFILE_API,
  ANNOUNCEMENTS_API,
  ADMIN_STATS_API,
  ACCOUNTS_API,
  ACCOUNT_DETAILS_API,
  ADMIN_INFLUENCERS_API,
  INFLUENCER_STATUS_API,
  VERIFY_CERTIFICATE_API,
  SLOTS_OVERVIEW_API,
  ADMIN_USERS_API,
  USER_STATUS_API,
  ADMIN_BOOKINGS_API,
  CONVERSATIONS_API,
} from './endpoints';

export const adminApi = {
  billing: { getTransactions: () => client.get('/bookings/transactions') },
  profile: { update: (profile) => client.put(ADMIN_PROFILE_API, profile) },
  announcements: {
    getAll: () => client.get(ANNOUNCEMENTS_API),
    getById: (id) => client.get(ANNOUNCEMENT_DETAILS_API(id)),
    update: (id, payload) => client.put(ANNOUNCEMENT_DETAILS_API(id), payload),
    remove: (id) => client.delete(ANNOUNCEMENT_DETAILS_API(id)),
    send: (payload) => client.post(ANNOUNCEMENTS_API, payload) },
  accounts: {
    getDetails: (role, id) => client.get(ACCOUNT_DETAILS_API(role, id)),
    getAll: () => client.get(ACCOUNTS_API),
  },
  auth: {
    forgotPassword: (payload) => client.post('/auth/forgot-password', payload, { authenticated: false }),
    verifyOtp: (payload) => client.post('/auth/verify-reset-otp', payload, { authenticated: false }),
    resetPassword: (payload) => client.post('/auth/reset-password', payload, { authenticated: false }),
    login: (email, password) => client.post(ADMIN_LOGIN_API, { email, password, role: 'admin' }, { authenticated: false }),
    getMe: () => client.get(CURRENT_ADMIN_API),
  },
  stats: { getOverview: () => client.get(ADMIN_STATS_API) },
  influencers: {
    getAll: (status = 'all') => client.get(ADMIN_INFLUENCERS_API, { params: { status } }),
    updateStatus: (id, status, reason = '') => client.put(INFLUENCER_STATUS_API(id), { status, reason }),
    verifyCertificate: (id, isVerified, certificateStatus) => client.put(VERIFY_CERTIFICATE_API(id), { isVerified, certificateStatus }),
    getSlotsOverview: (id, date = '') => client.get(SLOTS_OVERVIEW_API(id), { params: date ? { date } : {} }),
  },
  users: {
    getAll: (status = 'all') => client.get(ADMIN_USERS_API, { params: { status } }),
    updateStatus: (id, status, reason = '') => client.put(USER_STATUS_API(id), { status, reason }),
  },
  bookings: {
    getAll: (status = 'all', influencerId = '') => client.get(ADMIN_BOOKINGS_API, {
      params: { ...(status && status !== 'all' ? { status } : {}), ...(influencerId ? { influencerId } : {}) },
    }),
  },
  conversations: { getAll: () => client.get(CONVERSATIONS_API) },
};
