"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsers } from "@/lib/api";
import { User, Pagination as PaginationType } from "@/types";
import {
  Card, StatusBadge, Pagination, LoadingSpinner, EmptyState,
  Input, Select, SkeletonRow,
} from "@/components/ui";
import { Users, Search } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@/lib/useDebounce";

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
      const res = await getUsers({ page, limit: 20, role: role !== "all" ? role : undefined, search: debouncedSearch || undefined });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, role, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [role, debouncedSearch]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
            className="pl-8"
          />
        </div>
        <Select
          value={role}
          onChange={setRole}
          options={[
            { label: "All Roles", value: "all" },
            { label: "Vendor", value: "vendor" },
            { label: "Rider", value: "rider" },
            { label: "Customer", value: "customer" },
            { label: "Admin", value: "admin" },
          ]}
        />
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {pagination ? `${pagination.total} total` : ""}
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : users.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<Users size={20} />} title="No users found" description="Try adjusting your filters" /></td></tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--brand-red), #c85c5c)" }}>
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{user.name || "—"}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{user.email}</td>
                    <td><StatusBadge status={user.role} /></td>
                    <td><StatusBadge status={user.isActive ? "active" : "inactive"} /></td>
                    <td>
                      <span className="text-xs font-mono" style={{ color: user.emailVerified ? "var(--brand-teal)" : "var(--text-muted)" }}>
                        {user.emailVerified ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination page={page} pages={pagination.pages} total={pagination.total} limit={20} onPage={setPage} />
        )}
      </Card>
    </div>
  );
}
