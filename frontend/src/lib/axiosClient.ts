import axios from "axios";

export const PI_ACCESS_TOKEN_KEY = "cryptoid_pi_access_token";
export const ADMIN_TEST_HEADER = "x-cryptoid-admin-test";

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
  if (sessionStorage.getItem("cryptoid_admin_preview") === "1"
    && !["/user/signin", "/user/signout", "/user/admin-mode"].includes(config.url || "")) {
    config.headers.set(ADMIN_TEST_HEADER, "1");
  }

  return config;
});
