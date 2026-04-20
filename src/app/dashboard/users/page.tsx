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
import { Users, Search, Check, X } from "lucide-react";
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
    <div className="space-y-6">
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
          <p className="font-mono text-[10px] tracking-widest text-gray-900 uppercase">
            {pagination ? `${pagination.total} Accounts` : ""}
          </p>
        </div>

        {/* Brand Tabs for Roles */}
        <div
          className="flex items-center gap-8 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {ROLE_TABS.map((tab) => {
            const isActive = role === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setRole(tab.value)}
                className="pb-4 text-sm font-medium transition-all relative"
                style={{
                  color: isActive ? "var(--brand-teal)" : "text-gray-900",
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

      <Card className="border-none shadow-sm overflow-hidden">
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
                        {/* Humanized Active/Inactive with dots */}
                        <div className="flex items-center gap-1.5 min-w-[70px]">
                          <span className="text-sm text-gray-900">
                            {user.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                        {/* Verified mark */}
                        <div className="flex items-center gap-1">
                          {user.emailVerified ? (
                            <Check
                              size={14}
                              style={{ color: "var(--brand-teal)" }}
                            />
                          ) : (
                            <X size={14} className="text-gray-300" />
                          )}
                        </div>
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
        {pagination && (
          <div
            className="p-4 border-t"
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
      </Card>
    </div>
  );
}
