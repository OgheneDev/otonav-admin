"use client";

import { Menu, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/users": "Users",
  "/dashboard/organizations": "Organizations",
  "/dashboard/orders": "Orders",
  "/dashboard/verified-riders": "Verified Riders",
  "/dashboard/waitlist": "Waitlist",
  "/dashboard/analytics": "Analytics",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const getTitle = () => {
    const exact = pageTitles[pathname];
    if (exact) return exact;
    const parent = Object.entries(pageTitles).find(
      ([k]) => k !== "/dashboard" && pathname.startsWith(k),
    );
    return parent?.[1] || "Admin";
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-5 sticky top-0 z-30"
      style={{
        background: "rgba(248,248,246,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-white transition-all lg:hidden"
          style={{
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <Menu size={18} />
        </button>
        <h2 className="font-display text-xl text-gray-900 leading-none">
          {getTitle()}
        </h2>
      </div>
    </header>
  );
}
