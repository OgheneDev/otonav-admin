import axios from "axios";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove("admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const adminLogin = (email: string, password: string) =>
  api.post("/admin/login", { email, password });

export const adminLogout = () => api.post("/admin/logout");

// Dashboard
export const getDashboardOverview = () => api.get("/admin/dashboard");

// Users
export const getUsers = (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
  api.get("/admin/users", { params });

export const getUserById = (userId: string) =>
  api.get(`/admin/users/${userId}`);

// Organizations
export const getOrganizations = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get("/admin/organizations", { params });

export const getOrganizationById = (orgId: string) =>
  api.get(`/admin/organizations/${orgId}`);

// Orders
export const getOrders = (params?: { page?: number; limit?: number; status?: string; orgId?: string }) =>
  api.get("/admin/orders", { params });

export const getOrderById = (orderId: string) =>
  api.get(`/admin/orders/${orderId}`);

// Verified Riders
export const getVerifiedRiders = (params?: { page?: number; limit?: number }) =>
  api.get("/admin/verified-riders", { params });

export const removeVerifiedRider = (riderId: string) =>
  api.delete(`/admin/verified-riders/${riderId}/remove-verified`);

export const createVerifiedRider = (data: {
  email: string;
  name?: string;
  phoneNumber?: string;
  password: string;
}) => api.post("/admin/verified-riders/create", data);

// Waitlist
export const getWaitlist = (params?: { page?: number; limit?: number; status?: string }) =>
  api.get("/admin/waitlist", { params });

export const getOrgWaitlist = (orgId: string) =>
  api.get(`/admin/waitlist/${orgId}`);

// Analytics
export const getOrderAnalytics = (period?: "week" | "month" | "year") =>
  api.get("/admin/analytics/orders", { params: { period } });

export const getRiderAnalytics = () =>
  api.get("/admin/analytics/riders");
