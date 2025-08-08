const isDevelopment = process.env.NODE_ENV === "development";

export const API_BASE_URL = isDevelopment
  ? "http://localhost:8000"
  : "https://api.myapp.com"; // update this
