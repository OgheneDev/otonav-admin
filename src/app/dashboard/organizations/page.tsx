"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrganizations } from "@/lib/api";
import { Organization, Pagination as PaginationType } from "@/types";
import {
  Pagination,
  EmptyState,
  Input,
  SkeletonRow,
  Card,
} from "@/components/ui";
import {
  Building2,
  Search,
  Users,
  ArrowRight,
  Layers,
  Calendar,
} from "lucide-react";
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

  const humanizePlan = (plan?: string) => {
    if (!plan) return "No Plan";
    return plan.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-4 md:p-2">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center justify-center md:justify-start gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg w-fit">
          <Layers size={14} className="text-[var(--brand-teal)]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-900">
            {pagination?.total ?? 0} Entities Found
          </span>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-md group">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--brand-teal)] transition-colors"
          />
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Search organizations..."
            className="pl-10 border-gray-200 focus:border-[var(--brand-teal)] transition-all"
          />
        </div>
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 animate-pulse rounded-2xl"
            />
          ))
        ) : orgs.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} className="text-gray-200" />}
            title="No organizations found"
          />
        ) : (
          orgs.map((org) => {
            const memberCount =
              org.memberCounts?.reduce((s, m) => s + Number(m.count), 0) ?? 0;
            const isEnterprise = org.subscriptionPlan
              ?.toLowerCase()
              .includes("enterprise");

            return (
              <div
                key={org.id}
                onClick={() =>
                  router.push(`/dashboard/organizations/${org.id}`)
                }
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--brand-teal)]/5 flex items-center justify-center text-[var(--brand-teal)]">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {org.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono mt-0.5">
                        <Calendar size={10} />
                        {format(new Date(org.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                      isEnterprise
                        ? "border-[var(--brand-teal)] text-[var(--brand-teal)] bg-[var(--brand-teal)]/5"
                        : "border-gray-100 text-gray-500 bg-gray-50"
                    }`}
                  >
                    {humanizePlan(org.subscriptionPlan)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                        <Users size={10} className="text-gray-400" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      Members:{" "}
                      <span className="text-gray-900 font-mono">
                        {memberCount}
                      </span>
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-gray-300" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <Card className="hidden md:block border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Organization Name
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Tier / Plan
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Members
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Registration
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} cols={5} />
                  ))
                : orgs.map((org) => {
                    const memberCount =
                      org.memberCounts?.reduce(
                        (s, m) => s + Number(m.count),
                        0,
                      ) ?? 0;
                    const isEnterprise = org.subscriptionPlan
                      ?.toLowerCase()
                      .includes("enterprise");

                    return (
                      <tr
                        key={org.id}
                        className="hover:bg-gray-50/80 cursor-pointer transition-all group"
                        onClick={() =>
                          router.push(`/dashboard/organizations/${org.id}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">
                              {org.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs text-center font-medium  ${
                              isEnterprise
                                ? "border-[var(--brand-teal)] text-[var(--brand-teal)] bg-[var(--brand-teal)]/5"
                                : ""
                            }`}
                          >
                            {humanizePlan(org.subscriptionPlan)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-900">
                            <Users size={14} className="text-gray-400" />
                            <span className="text-sm font-mono">
                              {memberCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-600">
                            {format(new Date(org.createdAt), "dd MMM, yyyy")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ArrowRight
                            size={16}
                            className="inline text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all"
                          />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer / Pagination */}
      {pagination && (
        <div className="p-4 md:px-6 md:py-4 border-t border-gray-100 bg-white md:bg-gray-50/30 rounded-2xl md:rounded-none shadow-sm md:shadow-none">
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
