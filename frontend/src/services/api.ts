import axios from "axios";

import { API_BASE_URL } from "../config";
import eventBus from "./eventBus";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setupInterceptors = () => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        eventBus.dispatch("logout");
      }
      return Promise.reject(error);
    },
  );
};

export default api;
