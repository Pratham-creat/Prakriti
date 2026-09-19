import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach the stored JWT to protected requests.
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

// Authentication
api.login = async ({ username, password }) => {
  const response = await api.post("/auth/login", {
    username,
    password,
  });

  return response.data;
};

// Dashboard / stock
api.dashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};

api.stock = async () => {
  const response = await api.get("/stock");
  return response.data;
};

// Masters
api.financialYears = async () => {
  const response = await api.get("/masters/financial-years");
  return response.data;
};

api.quarters = async () => {
  const response = await api.get("/masters/quarters");
  return response.data;
};

api.schemes = async () => {
  const response = await api.get("/masters/schemes");
  return response.data;
};

api.species = async () => {
  const response = await api.get("/masters/species");
  return response.data;
};

api.materials = async () => {
  const response = await api.get("/masters/materials");
  return response.data;
};

api.fundComponents = async (schemeHeadId) => {
  const response = await api.get("/masters/fund-components", {
    params: schemeHeadId
      ? { scheme_head_id: schemeHeadId }
      : undefined,
  });

  return response.data;
};

// Funds
api.funds = async () => {
  const response = await api.get("/fund-receipts");
  return response.data;
};

api.createFund = async (payload) => {
  const response = await api.post("/fund-receipts", payload);
  return response.data;
};

// Labour / attendance
api.labour = async () => {
  const response = await api.get("/labour");
  return response.data;
};

api.attendance = async () => {
  const response = await api.get("/attendance");
  return response.data;
};

api.createAttendance = async (payload) => {
  const response = await api.post("/attendance", payload);
  return response.data;
};

// Convert FastAPI validation errors into a readable message.
function formatApiError(error) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        const location = Array.isArray(item?.loc)
          ? item.loc.join(".")
          : "request";
        return `${location}: ${item?.msg || "Invalid value"}`;
      })
      .join(" | ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  if (typeof detail === "string") {
    return detail;
  }

  return error?.message || "Request failed.";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = formatApiError(error);
    return Promise.reject(error);
  }
);

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

export { api };
export default api;
