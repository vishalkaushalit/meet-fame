const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

function getAuthHeaders() {
  const token = localStorage.getItem('meetfame_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  notifications: {
    request: async (path = '', method = 'GET') => {
      const res = await fetch(`${API_BASE}/notifications${path}`, {
        method,
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
  },
  calls: {
    request: async (bookingId, action, payload = {}, sessionToken) => {
      const res = await fetch(
        `${API_BASE}/calls/${encodeURIComponent(bookingId)}/${action}`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            ...(action === 'leave' && sessionToken
              ? { Authorization: `Bearer ${sessionToken}` }
              : {}),
          },
          body: JSON.stringify(payload),
          keepalive: action === 'leave',
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw Object.assign(new Error(data.error || 'Call request failed.'), {
          status: res.status,
        });
      return data;
    },
  },
  auth: {
    login: async (email, password, role) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw data;
      }
      return data;
    },

    registerUser: async (payload) => {
      const res = await fetch(`${API_BASE}/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    registerInfluencer: async (formData) => {
      const res = await fetch(`${API_BASE}/auth/register-influencer`, {
        method: 'POST',
        body: formData, // FormData with file & fields
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    },
  },

  influencers: {
    getAll: async (category = '', search = '') => {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/influencers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch influencers');
      return res.json();
    },

    getById: async (id) => {
      const res = await fetch(`${API_BASE}/influencers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch influencer');
      return res.json();
    },

    updateAvailability: async (id, availability) => {
      const res = await fetch(`${API_BASE}/influencers/${id}/availability`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ availability }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    uploadCertificate: async (id, formData) => {
      const token = localStorage.getItem('meetfame_token');
      const res = await fetch(
        `${API_BASE}/influencers/${id}/upload-certificate`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        },
      );
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    updateProfile: async (id, profile) => {
      const res = await fetch(`${API_BASE}/influencers/${id}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
  },

  bookings: {
    getSlots: async (influencerId, date) => {
      const res = await fetch(
        `${API_BASE}/bookings/slots?influencerId=${influencerId}&date=${date}`,
      );
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    create: async (bookingData) => {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    getMyBookings: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/bookings/my-bookings?${query}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  },

  chat: {
    getMessages: async (conversationId) => {
      const res = await fetch(`${API_BASE}/chat/${conversationId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },

    sendMessage: async (payload) => {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
  },
};
