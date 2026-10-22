import { upload } from '@vercel/blob/client';
import { client } from './client';
import {
  API_BASE,
  LOGIN_API,
  CURRENT_USER_API,
  REGISTER_USER_API,
  REGISTER_INFLUENCER_API,
  INTRO_VIDEO_UPLOAD_API,
  NOTIFICATIONS_API,
  CALL_API,
  INFLUENCERS_API,
  INFLUENCER_DETAILS_API,
  INFLUENCER_AVAILABILITY_API,
  UPLOAD_CERTIFICATE_API,
  INFLUENCER_PROFILE_API,
  CREATE_BOOKING_API,
  BOOKING_SLOTS_API,
  MY_BOOKINGS_API,
  CHAT_MESSAGES_API,
  SEND_MESSAGE_API,
} from './endpoints';

const publicRequest = { authenticated: false };

export const api = {
  billing: { getTransactions: () => client.get('/bookings/transactions') },
  notifications: {
    request: (path = '', method = 'GET') => client.request({ url: NOTIFICATIONS_API(path), method }),
  },
  calls: {
    request: (bookingId, action, payload = {}, sessionToken) => client.post(
      CALL_API(bookingId, action), payload,
      action === 'leave' ? {
        // Axios's fetch adapter preserves delivery during page unload.
        adapter: 'fetch', fetchOptions: { keepalive: true },
        ...(sessionToken ? { headers: { Authorization: `Bearer ${sessionToken}` } } : {}),
      } : {},
    ),
  },
  auth: {
    forgotPassword: (payload) => client.post('/auth/forgot-password', payload, publicRequest),
    resetPassword: (payload) => client.post('/auth/reset-password', payload, publicRequest),
    login: (email, password, role) => client.post(LOGIN_API, { email, password, role }, publicRequest),
    registerUser: (payload) => client.post(REGISTER_USER_API, payload, publicRequest),
    registerInfluencer: async (formData) => {
      const payload = new FormData();
      for (const [key, value] of formData.entries()) payload.append(key, value);
      if (import.meta.env.PROD) {
        const file = payload.get('introVideoFile');
        const blob = await upload(`introduction_video/intro-${Date.now()}.${file.name.split('.').pop()}`, file, {
          access: 'public', handleUploadUrl: `${API_BASE}${INTRO_VIDEO_UPLOAD_API}`,
        });
        payload.delete('introVideoFile');
        payload.set('introVideoUrl', blob.url);
      }
      return client.post(REGISTER_INFLUENCER_API, payload, publicRequest);
    },
    getMe: () => client.get(CURRENT_USER_API),
  },
  influencers: {
    getAll: (category = '', search = '') => client.get(INFLUENCERS_API, {
      ...publicRequest, params: { ...(category && category !== 'All' ? { category } : {}), ...(search ? { search } : {}) },
    }),
    getById: (id) => client.get(INFLUENCER_DETAILS_API(id), publicRequest),
    updateAvailability: (id, availability) => client.put(INFLUENCER_AVAILABILITY_API(id), { availability }),
    uploadCertificate: (id, formData) => client.post(UPLOAD_CERTIFICATE_API(id), formData),
    updateProfile: (id, profile) => client.put(INFLUENCER_PROFILE_API(id), profile),
  },
  bookings: {
    createPaymentOrder: (data) => client.post(`${CREATE_BOOKING_API}/payment-order`, data),
    getSlots: (influencerId, date) => client.get(BOOKING_SLOTS_API, { ...publicRequest, params: { influencerId, date } }),
    create: (bookingData) => client.post(CREATE_BOOKING_API, bookingData),
    getMyBookings: (params = {}) => client.get(MY_BOOKINGS_API, { params }),
  },
  chat: {
    getMessages: (conversationId) => client.get(CHAT_MESSAGES_API(conversationId), publicRequest),
    sendMessage: (payload) => client.post(SEND_MESSAGE_API, payload),
  },
};
