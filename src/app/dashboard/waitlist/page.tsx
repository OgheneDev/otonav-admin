"use client";

import { useEffect, useState, useCallback } from "react";
import { getWaitlist } from "@/lib/api";
import { WaitlistEntry, Pagination as PaginationType } from "@/types";
import { Card, Pagination, EmptyState, SkeletonRow } from "@/components/ui";
import { Building2, ExternalLink, Layers, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_OPTIONS = [
  { label: "All Logs", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "Completed", value: "completed" },
];

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  // Helper to turn "in_transit" into "In Transit"
  const humanizeStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWaitlist({
        page,
        limit: 20,
        status: status !== "all" ? status : undefined,
      });
      setEntries(res.data.data.waitlist);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  return (
    <div className="space-y-6 p-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">
            {pagination
              ? `${pagination.total} Live Requests`
              : "Syncing sequence..."}
          </p>
        </div>

        {/* Segmented Tabs Control */}
        <div className="flex p-1 bg-gray-100/80 rounded-xl w-fit">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">
                  Pos.
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">
                  Order Ref
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">
                  Organization
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">
                  Timeline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={5} />
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Layers size={32} className="text-gray-200" />}
                      title="No Entries Found"
                      description="The waitlist is currently clear for this status filter."
                    />
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <span className="text-2xl font-medium tabular-nums text-[var(--brand-teal)] tracking-tighter">
                        {entry.position.toString().padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/orders/${entry.orderId}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[var(--brand-teal)] transition-colors group/link"
                      >
                        <span>#{entry.orderNumber}</span>
                        <ExternalLink
                          size={12}
                          className="opacity-0 group-hover/link:opacity-100 transition-all translate-y-0.5 group-hover/link:translate-y-0"
                        />
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.orgName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {/* Plain text humanized status */}
                      <span className="text-sm text-gray-600">
                        {humanizeStatus(entry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 uppercase tracking-tighter">
                          <Clock size={10} />
                          Added:{" "}
                          {format(new Date(entry.createdAt), "MMM d, HH:mm")}
                        </div>
                        {entry.assignedAt && (
                          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--brand-teal)] uppercase tracking-tighter font-bold">
                            <span className="w-1 h-1 rounded-full bg-current" />
                            Assigned:{" "}
                            {format(new Date(entry.assignedAt), "MMM d, HH:mm")}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50">
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
