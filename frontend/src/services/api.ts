import axios, { AxiosError } from "axios";

import eventBus from "./eventBus";

let userRole: string | null = null;
eventBus.on("userUpdate", (user) => {
  userRole = user ? user.role : null;
});

const api = axios.create({
  baseURL: "/api"
});

export const setupInterceptors = () => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const allowGuest = (config as any).allowGuest || false;

    if (userRole === "guest" && !allowGuest) {
      return Promise.reject(
        new AxiosError(
          "Guests are not allowed to perform this action.",
          "ERR_FORBIDDEN"
        )
      );
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      if (
        response.config.url &&
        !response.config.url.includes("/login") &&
        !response.config.url.includes("/logout") &&
        !response.config.url.includes("/user") &&
        !response.config.url.includes("/storage")
      ) {
        eventBus.dispatch("apiSuccess");
      }
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        eventBus.dispatch("logout");
      }
      return Promise.reject(error);
    }
  );
};

export default api;
