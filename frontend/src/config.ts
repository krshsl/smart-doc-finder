const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const guestUser = {
  username: "guest",
  password: "password"
};
