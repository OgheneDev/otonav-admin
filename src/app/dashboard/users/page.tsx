"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsers } from "@/lib/api";
import { User, Pagination as PaginationType } from "@/types";
import {
  Card,
  Pagination,
  EmptyState,
  Input,
  SkeletonRow,
} from "@/components/ui";
import { Users, Search, Check, X, ShieldCheck, Mail } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@/lib/useDebounce";

const ROLE_TABS = [
  { label: "All Users", value: "all" },
  { label: "Vendors", value: "owner" },
  { label: "Riders", value: "rider" },
  { label: "Customers", value: "customer" },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page,
        limit: 20,
        role: role !== "all" ? role : undefined,
        search: debouncedSearch || undefined,
      });
      const filteredUsers = res.data.data.users.filter(
        (user: User) => user.role !== "admin",
      );
      setUsers(filteredUsers);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, role, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [role, debouncedSearch]);

  const formatStatus = (raw: string) => {
    if (raw === "owner") return "Vendor";
    return raw.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Search and Filters */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={search}
              onChange={setSearch}
              placeholder="Search name or email..."
              className="pl-10 border-gray-200 focus:border-[var(--brand-teal)] transition-all"
            />
          </div>
          <p className="font-mono text-[10px] tracking-widest text-gray-900 uppercase hidden sm:block">
            {pagination ? `${pagination.total} Accounts` : ""}
          </p>
        </div>

        {/* Brand Tabs for Roles */}
        <div
          className="flex items-center gap-6 md:gap-8 border-b overflow-x-auto no-scrollbar"
          style={{ borderColor: "var(--border)" }}
        >
          {ROLE_TABS.map((tab) => {
            const isActive = role === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setRole(tab.value)}
                className="pb-4 text-sm font-medium transition-all relative whitespace-nowrap"
                style={{
                  color: isActive ? "var(--brand-teal)" : "var(--text-muted)",
                }}
              >
                {tab.label}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "var(--brand-teal)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 animate-pulse rounded-2xl"
            />
          ))
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={20} />} title="No users found" />
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              onClick={() => router.push(`/dashboard/users/${user.id}`)}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--brand-red), #c85c5c)",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || "—"}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-mono text-gray-500 truncate">
                      {user.email}
                    </p>
                    {user.emailVerified && (
                      <ShieldCheck
                        size={12}
                        className="text-[var(--brand-teal)]"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="px-2 py-0.5 bg-gray-50 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  {formatStatus(user.role)}
                </span>
                <span
                  className={`text-[11px] font-medium ${user.isActive ? "text-[var(--brand-teal)]" : "text-gray-400"}`}
                >
                  {user.isActive ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <Card className="hidden md:block border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono">
                  User
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono">
                  Role
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono text-right">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={4} />
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<Users size={20} />}
                      title="No users found"
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--brand-red), #c85c5c)",
                          }}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-sm text-gray-900 font-medium">
                            {user.name || "—"}
                          </div>
                          <div className="text-[11px] font-mono text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatStatus(user.role)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-sm text-gray-900">
                          {user.isActive ? "Active" : "Disabled"}
                        </span>
                        {user.emailVerified ? (
                          <Check
                            size={14}
                            style={{ color: "var(--brand-teal)" }}
                          />
                        ) : (
                          <X size={14} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-xs text-gray-900">
                        {format(new Date(user.createdAt), "dd MMM, yyyy")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Footer */}
      {pagination && (
        <div
          className="p-4 bg-white md:bg-transparent rounded-2xl md:rounded-none border border-gray-100 md:border-none md:border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <Pagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            limit={20}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
