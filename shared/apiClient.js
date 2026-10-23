// Share transport behavior while each application owns its Axios dependency.
export function createApiClient(axios, { baseURL, getToken }) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use((config) => {
    const token = config.authenticated === false ? null : getToken();
    if (token && !config.headers.has('Authorization'))
      config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });
  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const body = error.response?.data;
      const details = body && typeof body === 'object' ? body : {};
      const normalized = Object.assign(
        new Error(
          details.error ||
            details.message ||
            error.message ||
            'Request failed.',
        ),
        details,
        { status: details.status ?? error.response?.status },
      );
      return Promise.reject(normalized);
    },
  );
  return client;
}
