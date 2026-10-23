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
  bankDetails: {
    get: () => {
      return client.get('/auth/bank-details');
    },
    save: (details) => {
      return client.put('/auth/bank-details', details);
    },
  },
  billing: {
    getTransactions: () => {
      return client.get('/bookings/transactions');
    },
  },
  profile: {
    update: (profile) => {
      return client.put(ADMIN_PROFILE_API, profile);
    },
  },
  announcements: {
    getAll: () => {
      return client.get(ANNOUNCEMENTS_API);
    },
    getById: (id) => {
      return client.get(ANNOUNCEMENT_DETAILS_API(id));
    },
    update: (id, payload) => {
      return client.put(ANNOUNCEMENT_DETAILS_API(id), payload);
    },
    remove: (id) => {
      return client.delete(ANNOUNCEMENT_DETAILS_API(id));
    },
    send: (payload) => {
      return client.post(ANNOUNCEMENTS_API, payload);
    },
  },
  accounts: {
    getDetails: (role, id) => {
      return client.get(ACCOUNT_DETAILS_API(role, id));
    },
    getAll: () => {
      return client.get(ACCOUNTS_API);
    },
  },
  auth: {
    forgotPassword: (payload) => {
      return client.post('/auth/forgot-password', payload, {
        authenticated: false,
      });
    },
    verifyOtp: (payload) => {
      return client.post('/auth/verify-reset-otp', payload, {
        authenticated: false,
      });
    },
    resetPassword: (payload) => {
      return client.post('/auth/reset-password', payload, {
        authenticated: false,
      });
    },
    login: (email, password) => {
      return client.post(
        ADMIN_LOGIN_API,
        { email, password, role: 'admin' },
        { authenticated: false },
      );
    },
    getMe: () => {
      return client.get(CURRENT_ADMIN_API);
    },
  },
  stats: {
    getOverview: () => {
      return client.get(ADMIN_STATS_API);
    },
  },
  influencers: {
    getAll: (status = 'all') => {
      return client.get(ADMIN_INFLUENCERS_API, { params: { status } });
    },
    updateStatus: (id, status, reason = '') => {
      return client.put(INFLUENCER_STATUS_API(id), { status, reason });
    },
    verifyCertificate: (id, isVerified, certificateStatus) => {
      return client.put(VERIFY_CERTIFICATE_API(id), {
        isVerified,
        certificateStatus,
      });
    },
    getSlotsOverview: (id, date = '') => {
      return client.get(SLOTS_OVERVIEW_API(id), {
        params: date ? { date } : {},
      });
    },
  },
  users: {
    getAll: (status = 'all') => {
      return client.get(ADMIN_USERS_API, { params: { status } });
    },
    updateStatus: (id, status, reason = '') => {
      return client.put(USER_STATUS_API(id), { status, reason });
    },
  },
  bookings: {
    getAll: (status = 'all', influencerId = '') => {
      return client.get(ADMIN_BOOKINGS_API, {
        params: {
          ...(status && status !== 'all' ? { status } : {}),
          ...(influencerId ? { influencerId } : {}),
        },
      });
    },
  },
  conversations: {
    getAll: () => {
      return client.get(CONVERSATIONS_API);
    },
  },
};
