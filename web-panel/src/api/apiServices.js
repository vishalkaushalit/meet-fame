import axiosInstance, {
  API_BASE_URL,
  api as apiRequest,
  setAuthToken,
} from "./axiosInstance";

export { API_BASE_URL };

const getData = (request) => {
  return request.then((response) => response.data);
};

export const profileApi = {
  update: (profile) => getData(apiRequest.put("/admin/profile", profile)),
};

export const announcementsApi = {
  getAll: () => getData(apiRequest.get("/admin/announcements")),
  create: (payload) =>
    getData(apiRequest.create("/admin/announcements", payload)),
  update: (id, payload) =>
    getData(
      apiRequest.put(
        `/admin/announcements/${encodeURIComponent(id)}`,
        payload,
      ),
    ),
  delete: (id) =>
    getData(
      apiRequest.delete(
        `/admin/announcements/${encodeURIComponent(id)}`,
      ),
    ),
};

export const accountsApi = {
  getDetails: (role, id) =>
    getData(
      apiRequest.get(
        `/admin/accounts/${encodeURIComponent(role)}/${encodeURIComponent(id)}`,
      ),
    ),
  getAll: () => getData(apiRequest.get("/admin/accounts")),
};

export const authApi = {
  login: async (email, password) => {
    const data = await getData(
      apiRequest.create("/auth/login", {
        email,
        password,
        role: "admin",
      }),
    );
    const token =
      data?.accessToken ??
      data?.token ??
      data?.data?.accessToken ??
      data?.data?.token;

    if (token) {
      setAuthToken(token);
    }

    return data;
  },
  getMe: () => getData(apiRequest.get("/auth/me")),
};

export const statsApi = {
  getOverview: () => getData(apiRequest.get("/admin/stats")),
};

export const influencersApi = {
  getAll: (status = "all") =>
    getData(
      apiRequest.get("/admin/influencers", {
        params: status && status !== "all" ? { status } : undefined,
      }),
    ),
  updateStatus: (id, status, reason = "") =>
    getData(
      apiRequest.put(
        `/admin/influencers/${encodeURIComponent(id)}/status`,
        { status, reason },
      ),
    ),
  verifyCertificate: (id, isVerified, certificateStatus) =>
    getData(
      apiRequest.put(
        `/admin/influencers/${encodeURIComponent(id)}/verify-certificate`,
        { isVerified, certificateStatus },
      ),
    ),
  getSlotsOverview: (id, date = "") =>
    getData(
      apiRequest.get(
        `/admin/influencers/${encodeURIComponent(id)}/slots-overview`,
        { params: date ? { date } : undefined },
      ),
    ),
};

export const usersApi = {
  getAll: (status = "all") =>
    getData(
      apiRequest.get("/admin/users", {
        params: { status },
      }),
    ),
  updateStatus: (id, status, reason = "") =>
    getData(
      apiRequest.put(
        `/admin/users/${encodeURIComponent(id)}/status`,
        { status, reason },
      ),
    ),
};

export const bookingsApi = {
  getAll: (status = "all", influencerId = "") =>
    getData(
      apiRequest.get("/admin/bookings", {
        params: {
          ...(status && status !== "all" ? { status } : {}),
          ...(influencerId ? { influencerId } : {}),
        },
      }),
    ),
  create: (booking) =>
    getData(apiRequest.create("/admin/bookings", booking)),
};

export const conversationsApi = {
  getAll: () => getData(apiRequest.get("/admin/conversations")),
};

export const adminApi = {
  profile: profileApi,
  announcements: announcementsApi,
  accounts: accountsApi,
  auth: authApi,
  stats: statsApi,
  influencers: influencersApi,
  users: usersApi,
  bookings: bookingsApi,
  conversations: conversationsApi,
};

export { axiosInstance };
export default adminApi;
