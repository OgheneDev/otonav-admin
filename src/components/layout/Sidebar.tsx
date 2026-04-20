"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { adminLogout } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  ShieldCheck,
  Clock,
  BarChart2,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    label: "Management",
    items: [
      { label: "Users", icon: Users, href: "/dashboard/users" },
      {
        label: "Organizations",
        icon: Building2,
        href: "/dashboard/organizations",
      },
      { label: "Orders", icon: Package, href: "/dashboard/orders" },
    ],
  },
  {
    label: "Riders",
    items: [
      {
        label: "Verified Riders",
        icon: ShieldCheck,
        href: "/dashboard/verified-riders",
      },
      { label: "Waitlist", icon: Clock, href: "/dashboard/waitlist" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, clearAuth } = useAuthStore();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {}
    clearAuth();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "#FFFFFF",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-6 py-6 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h1
              className="font-body text-2xl leading-none"
              style={{ color: "var(--brand-red)" }}
            >
              OtoNav
            </h1>
            <p
              className="text-[10px] tracking-[0.2em] uppercase mt-1"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Admin Console
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg lg:hidden hover:bg-gray-100 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p
                className="px-3 mb-1.5 text-[10px] text-gray-600 font-semibold tracking-[0.15em] uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative"
                      style={{
                        background: active
                          ? "rgba(0,160,130,0.07)"
                          : "transparent",
                        color: active
                          ? "var(--brand-teal)"
                          : "var(--text-secondary)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {active && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                          style={{ background: "var(--brand-teal)" }}
                        />
                      )}
                      <item.icon
                        size={17}
                        className="shrink-0"
                        style={{
                          color: active
                            ? "var(--brand-teal)"
                            : "var(--text-muted)",
                        }}
                      />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight
                        size={13}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin + Logout */}
        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-3 px-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-red), #c85c5c)",
              }}
            >
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {admin?.name || "Admin"}
              </p>
              <p
                className="text-[11px] truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {admin?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-red-50 group"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut
              size={16}
              className="group-hover:text-red-500 transition-colors"
            />
            <span className="group-hover:text-red-500 text-gray-600 transition-colors">
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
