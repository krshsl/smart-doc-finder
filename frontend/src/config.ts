const isDevelopment = process.env.NODE_ENV === "development";

export const API_BASE_URL = isDevelopment ? "/api" : "https://api.myapp.com"; // update this

export const guestUser = {
  username: "guest",
  password: "password"
};
