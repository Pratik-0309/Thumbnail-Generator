import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 80000,
  headers: {
    "content-type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const isRefreshCall = originalRequest?.url?.includes(
      "/api/user/refresh-token"
    );

    // If token expired and not retried yet, and not the refresh call itself
    if (status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      try {
        await axiosInstance.post("/api/user/refresh-token");
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export {axiosInstance};
