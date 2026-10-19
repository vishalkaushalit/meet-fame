const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

function getAuthHeaders() {
  const token = localStorage.getItem('meetfame_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const adminApi = {
  profile: {
    update: async (profile) => {
      const res = await fetch(`${API_BASE}/admin/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
  },
  announcements: {
    send: async (payload) => {
      const res = await fetch(`${API_BASE}/admin/announcements`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
  },
  accounts: {
    getDetails: async (role, id) => {
      const res = await fetch(
        `${API_BASE}/admin/accounts/${encodeURIComponent(role)}/${encodeURIComponent(id)}`,
        { headers: getAuthHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/accounts`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  },
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    },
  },

  stats: {
    getOverview: async () => {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  },

  influencers: {
    getAll: async (status = 'all') => {
      const res = await fetch(
        `${API_BASE}/admin/influencers?status=${status}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error('Failed to fetch influencers');
      return res.json();
    },

    updateStatus: async (id, status, reason = '') => {
      const res = await fetch(`${API_BASE}/admin/influencers/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    verifyCertificate: async (id, isVerified, certificateStatus) => {
      const res = await fetch(
        `${API_BASE}/admin/influencers/${id}/verify-certificate`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isVerified, certificateStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },

    getSlotsOverview: async (id, date = '') => {
      const params = date ? `?date=${date}` : '';
      const res = await fetch(
        `${API_BASE}/admin/influencers/${id}/slots-overview${params}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error('Failed to fetch slots overview');
      return res.json();
    },
  },

  users: {
    getAll: async (status = 'all') => {
      const res = await fetch(`${API_BASE}/admin/users?status=${status}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },

    updateStatus: async (id, status, reason = '') => {
      const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
  },

  bookings: {
    getAll: async (status = 'all', influencerId = '') => {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (influencerId) params.append('influencerId', influencerId);
      const res = await fetch(
        `${API_BASE}/admin/bookings?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  },

  conversations: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/conversations`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  },
};
