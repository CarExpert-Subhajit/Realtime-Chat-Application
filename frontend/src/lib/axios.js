import axios from "axios";

export const axiosInstance = axios.create({
  // baseURL: "http://localhost:5001/api",
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  // baseURL: import.meta.env.VITE_API_BASE_URL,
  // baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  withCredentials: true,
});
