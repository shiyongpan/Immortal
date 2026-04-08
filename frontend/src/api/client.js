import axios from "axios";
import { storage } from "../utils/storage";

const client = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      storage.removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(err.response?.data || { error: "網路錯誤" });
  }
);

export default client;
