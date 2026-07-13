import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let refreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.request.use((config) => {
  const csrftoken = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
  if (csrftoken) {
    config.headers['X-CSRFToken'] = csrftoken.split('=')[1];
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => client(originalRequest))
          .catch(err => Promise.reject(err));
      }

      refreshing = true;
      originalRequest._retry = true;

      try {
        await client.post('/auth/refresh/');
        processQueue(null);
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
