import { create } from "zustand";
import Cookies from "js-cookie";
import { Admin } from "@/types";

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: Admin, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: Cookies.get("admin_token") || null,
  isAuthenticated: !!Cookies.get("admin_token"),
  setAuth: (admin, token) => {
    Cookies.set("admin_token", token, { expires: 1 });
    set({ admin, token, isAuthenticated: true });
  },
  clearAuth: () => {
    Cookies.remove("admin_token");
    set({ admin: null, token: null, isAuthenticated: false });
  },
}));
