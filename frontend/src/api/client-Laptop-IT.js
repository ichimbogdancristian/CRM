import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let refreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.request.use((config) => {
  const csrftoken = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("csrftoken="));
  if (csrftoken) {
    config.headers["X-CSRFToken"] = csrftoken.split("=")[1];
  }
  return config;
});

// These auth endpoints must never trigger the refresh cascade below:
// - a 401 from them is an expected "not logged in" / "bad credentials" outcome, not an expired session
// - /auth/refresh/ failing would otherwise recurse back into this same interceptor and deadlock forever
const AUTH_CASCADE_EXCLUDED_PATHS = [
  "/auth/login/",
  "/auth/refresh/",
  "/auth/me/",
];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isExcluded = AUTH_CASCADE_EXCLUDED_PATHS.some((path) =>
      originalRequest?.url?.startsWith(path),
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isExcluded
    ) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => client(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      refreshing = true;
      originalRequest._retry = true;

      try {
        await client.post("/auth/refresh/");
        processQueue(null);
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default client;
