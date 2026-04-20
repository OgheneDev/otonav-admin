"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrganizations } from "@/lib/api";
import { Organization, Pagination as PaginationType } from "@/types";
import {
  Card,
  StatusBadge,
  Pagination,
  LoadingSpinner,
  EmptyState,
  Input,
  SkeletonRow,
} from "@/components/ui";
import { Building2, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@/lib/useDebounce";

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrganizations({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
      });
      setOrgs(res.data.data.organizations);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Search organizations…"
            className="pl-8"
          />
        </div>
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {pagination ? `${pagination.total} total` : ""}
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Members</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={5} />
                ))
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Building2 size={20} />}
                      title="No organizations found"
                    />
                  </td>
                </tr>
              ) : (
                orgs.map((org) => {
                  const memberCount =
                    org.memberCounts?.reduce(
                      (s, m) => s + Number(m.count),
                      0,
                    ) ?? 0;
                  return (
                    <tr
                      key={org.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/organizations/${org.id}`)
                      }
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: "rgba(0,160,130,0.1)",
                              color: "var(--brand-teal)",
                            }}
                          >
                            <Building2 size={14} />
                          </div>
                          <span
                            className="font-medium text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {org.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        {org.subscriptionPlan ? (
                          <StatusBadge status={org.subscriptionPlan} />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div
                          className="flex items-center gap-1.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Users
                            size={13}
                            style={{ color: "var(--text-muted)" }}
                          />
                          <span className="text-sm font-mono">
                            {memberCount}
                          </span>
                        </div>
                      </td>
                      <td
                        className="font-mono text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {format(new Date(org.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            limit={20}
            onPage={setPage}
          />
        )}
      </Card>
    </div>
  );
}
