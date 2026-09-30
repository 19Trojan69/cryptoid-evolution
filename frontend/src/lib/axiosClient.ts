import axios from "axios";

export const PI_ACCESS_TOKEN_KEY = "cryptoid_pi_access_token";

const getBaseURL = () => {
  const runtimeURL = typeof window !== "undefined" ? window.__ENV?.backendURL : undefined;

  if (runtimeURL && runtimeURL !== "$$BACKEND_URL$$") {
    return runtimeURL;
  }

  return import.meta.env.VITE_BACKEND_URL || "/api";
};

export const axiosClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 20_000,
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const accessToken = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
  if (accessToken && !config.headers.get("Authorization")) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});
