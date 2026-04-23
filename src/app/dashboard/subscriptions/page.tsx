"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrganizations, getSubscriptionAnalytics } from "@/lib/api";
import { Pagination as PaginationType } from "@/types";
import { Card, Pagination, EmptyState, SkeletonRow } from "@/components/ui";
import { CreditCard, ChevronRight, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type PlanType = "starter" | "growth" | "pro" | null;
type StatusType = "pending" | "active" | "expired" | null;

interface OrgWithSub {
  id: string;
  name: string;
  address: string;
  subscriptionPlan: PlanType;
  subscriptionStatus: StatusType;
  maxRiders: number;
  currentRiderCount: number;
  extraRiders: number;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

interface AnalyticsData {
  planBreakdown: { plan: string | null; count: number }[];
  statusBreakdown: { status: string | null; count: number }[];
  totalRevenue: number;
}

const TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
];

const PLAN_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  growth: "var(--brand-teal)",
  pro: "var(--brand-red)",
};

const STATUS_COLORS: Record<string, string> = {
  active: "var(--brand-teal)",
  pending: "#f59e0b",
  expired: "#6b7280",
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgWithSub[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgsRes, analyticsRes] = await Promise.all([
        getOrganizations({
          page,
          limit: 20,
          search: search || undefined,
        }),
        page === 1 ? getSubscriptionAnalytics() : Promise.resolve(null),
      ]);

      let fetchedOrgs: OrgWithSub[] = orgsRes.data.data.organizations;

      // Filter by subscription status client-side since the orgs endpoint
      // doesn't have a status filter — for a large dataset you'd add it server-side
      if (statusFilter !== "all") {
        fetchedOrgs = fetchedOrgs.filter(
          (o) => o.subscriptionStatus === statusFilter,
        );
      }

      setOrgs(fetchedOrgs);
      setPagination(orgsRes.data.data.pagination);

      if (analyticsRes) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const getPlanColor = (plan: PlanType) =>
    plan ? (PLAN_COLORS[plan] ?? "#6b7280") : "#6b7280";

  const getStatusColor = (status: StatusType) =>
    status ? (STATUS_COLORS[status] ?? "#6b7280") : "#6b7280";

  const formatPlan = (plan: PlanType) =>
    plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "None";

  const formatStatus = (status: StatusType) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";

  // Pull stat counts from analytics
  const statCount = (
    key: "planBreakdown" | "statusBreakdown",
    value: string,
  ) => {
    if (!analytics) return "—";
    const arr =
      key === "planBreakdown"
        ? analytics.planBreakdown
        : analytics.statusBreakdown;
    const found = arr.find((item: any) =>
      key === "planBreakdown" ? item.plan === value : item.status === value,
    );
    return found?.count ?? 0;
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Summary Strip — only on desktop */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {[
          {
            label: "Active",
            value: statCount("statusBreakdown", "active"),
            color: "var(--brand-teal)",
          },
          {
            label: "Starter",
            value: statCount("planBreakdown", "starter"),
            color: "#3b82f6",
          },
          {
            label: "Growth",
            value: statCount("planBreakdown", "growth"),
            color: "var(--brand-teal)",
          },
          {
            label: "Pro",
            value: statCount("planBreakdown", "pro"),
            color: "var(--brand-red)",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="border-none shadow-sm bg-white px-5 py-4 flex items-center gap-4"
          >
            <div
              className="w-2 h-8 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <div>
              <p
                className="text-2xl font-medium tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded" />
                ) : (
                  s.value
                )}
              </p>
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs + Search Row */}
      <div
        className="flex items-center justify-between border-b relative"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar pr-10">
          {TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className="pb-4 text-sm font-medium transition-all relative whitespace-nowrap"
                style={{
                  color: isActive ? "var(--brand-teal)" : "var(--text-primary)",
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
        <p className="hidden md:block text-[10px] tracking-widest mb-4 font-mono text-gray-900 shrink-0">
          {pagination ? `${pagination.total} TOTAL` : ""}
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full md:w-72 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-primary)",
            background: "#fff",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--brand-teal)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-36 bg-gray-100 animate-pulse rounded-2xl"
            />
          ))
        ) : orgs.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={20} />}
            title="No subscriptions found"
          />
        ) : (
          orgs.map((org) => (
            <div
              key={org.id}
              onClick={() => router.push(`/dashboard/subscriptions/${org.id}`)}
              className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-medium text-gray-900 truncate">
                    {org.name}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">
                    {org.address}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: `${getStatusColor(org.subscriptionStatus)}10`,
                    color: getStatusColor(org.subscriptionStatus),
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: getStatusColor(org.subscriptionStatus),
                    }}
                  />
                  {formatStatus(org.subscriptionStatus)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  {org.subscriptionPlan && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        color: getPlanColor(org.subscriptionPlan),
                        background: `${getPlanColor(org.subscriptionPlan)}12`,
                      }}
                    >
                      {formatPlan(org.subscriptionPlan)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {org.currentRiderCount}/{org.maxRiders} riders
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <Card className="hidden md:block border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {[
                  "Organization",
                  "Plan",
                  "Status",
                  "Riders",
                  "Expires",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))
                : orgs.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() =>
                        router.push(`/dashboard/subscriptions/${org.id}`)
                      }
                    >
                      {/* Organization */}
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-gray-900">
                          {org.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                          {org.address}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-5">
                        {org.subscriptionPlan ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                            style={{
                              color: getPlanColor(org.subscriptionPlan),
                              background: `${getPlanColor(org.subscriptionPlan)}12`,
                            }}
                          >
                            {formatPlan(org.subscriptionPlan)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            None
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: getStatusColor(
                                org.subscriptionStatus,
                              ),
                            }}
                          />
                          {formatStatus(org.subscriptionStatus)}
                        </div>
                      </td>

                      {/* Riders */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width:
                                  org.maxRiders > 0
                                    ? `${Math.min(
                                        100,
                                        (org.currentRiderCount /
                                          org.maxRiders) *
                                          100,
                                      )}%`
                                    : "0%",
                                background:
                                  org.currentRiderCount >= org.maxRiders
                                    ? "var(--brand-red)"
                                    : "var(--brand-teal)",
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-900">
                            {org.currentRiderCount}/{org.maxRiders}
                          </span>
                        </div>
                      </td>

                      {/* Expires */}
                      <td className="px-6 py-5 font-mono text-xs text-gray-900">
                        {org.subscriptionExpiresAt ? (
                          format(
                            new Date(org.subscriptionExpiresAt),
                            "dd MMM, yyyy",
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Arrow */}
                      <td className="px-6 py-5 text-right">
                        <ChevronRight
                          size={16}
                          className="text-gray-300 group-hover:text-gray-600 transition-colors ml-auto"
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
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
