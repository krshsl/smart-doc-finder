const isDevelopment = process.env.NODE_ENV === "development";

export const API_BASE_URL = isDevelopment
  ? "/api"
  : "https://smart-doc-finder.onrender.com";

export const guestUser = {
  username: "guest",
  password: "password"
};
