export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');
const id = (value) => {
  return encodeURIComponent(value);
};

export const LOGIN_API = '/auth/login';
export const CURRENT_USER_API = '/auth/me';
export const REGISTER_USER_API = '/auth/register-user';
export const REGISTER_INFLUENCER_API = '/auth/register-influencer';
export const INTRO_VIDEO_UPLOAD_API = '/auth/intro-video-upload';
export const NOTIFICATIONS_API = (path = '') => {
  return `/notifications${path}`;
};
export const CALL_API = (bookingId, action) => {
  return `/calls/${id(bookingId)}/${id(action)}`;
};
export const INFLUENCERS_API = '/influencers';
export const INFLUENCER_DETAILS_API = (value) => {
  return `/influencers/${id(value)}`;
};
export const INFLUENCER_AVAILABILITY_API = (value) => {
  return `/influencers/${id(value)}/availability`;
};
export const UPLOAD_CERTIFICATE_API = (value) => {
  return `/influencers/${id(value)}/upload-certificate`;
};
export const INFLUENCER_PROFILE_API = (value) => {
  return `/influencers/${id(value)}/profile`;
};
export const CREATE_BOOKING_API = '/bookings';
export const BOOKING_SLOTS_API = '/bookings/slots';
export const MY_BOOKINGS_API = '/bookings/my-bookings';
export const CHAT_MESSAGES_API = (value) => {
  return `/chat/${id(value)}`;
};
export const SEND_MESSAGE_API = '/chat/send';
