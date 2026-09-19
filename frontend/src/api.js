import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Login
api.login = async ({ username, password }) => {
  const response = await api.post("/auth/login", {
    username,
    password,
  });

  return response.data;
};

// Dashboard
api.dashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};

// Stock
api.stock = async () => {
  const response = await api.get("/stock");
  return response.data;
};

// Token helpers
export function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

// IMPORTANT: export api itself
export { api };
export default api;