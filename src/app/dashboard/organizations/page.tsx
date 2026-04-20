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
import { Building2, Search, Users, ArrowRight, Layers } from "lucide-react";
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
    <div className="max-w-[1600px] mx-auto space-y-8 p-2">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
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

      {/* Table Container */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
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
                  Fleet Size
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
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={5} />
                ))
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <EmptyState
                      icon={<Building2 size={40} className="text-gray-200" />}
                      title="No organizations found"
                      description="Adjust your search terms to find specific entities."
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
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[var(--brand-teal)]/10 group-hover:text-[var(--brand-teal)] transition-colors">
                            <Building2 size={16} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 leading-none">
                            {org.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded border ${
                            isEnterprise
                              ? "border-[var(--brand-teal)] text-[var(--brand-teal)] bg-[var(--brand-teal)]/5"
                              : "border-gray-200 text-gray-600 bg-gray-50"
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
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-gray-100 transition-colors">
                          <ArrowRight
                            size={16}
                            className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {pagination && (
          <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30">
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
