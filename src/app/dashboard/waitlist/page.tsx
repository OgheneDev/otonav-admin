"use client";

import { useEffect, useState, useCallback } from "react";
import { getWaitlist } from "@/lib/api";
import { WaitlistEntry, Pagination as PaginationType } from "@/types";
import { Card, StatusBadge, Pagination, LoadingSpinner, EmptyState, Select, SkeletonRow } from "@/components/ui";
import { Clock, Hash, Building2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWaitlist({ page, limit: 20, status: status !== "all" ? status : undefined });
      setEntries(res.data.data.waitlist);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { label: "All Statuses", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Assigned", value: "assigned" },
            { label: "Completed", value: "completed" },
          ]}
        />
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {pagination ? `${pagination.total} entries` : ""}
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Order</th>
                <th>Organization</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Created</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : entries.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<Clock size={20} />} title="No waitlist entries" description="Entries appear when vendors request verified riders" /></td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Hash size={12} style={{ color: "var(--text-muted)" }} />
                        <span className="font-display text-lg leading-none" style={{ color: "var(--brand-teal)" }}>
                          {entry.position}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/orders/${entry.orderId}`}
                        className="font-mono text-xs hover:underline"
                        style={{ color: "var(--brand-teal)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {entry.orderNumber}
                      </Link>
                    </td>
                    <td className="text-sm">{entry.orgName}</td>
                    <td>
                      <div>
                        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{entry.vendorName}</p>
                        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{entry.vendorEmail}</p>
                      </div>
                    </td>
                    <td><StatusBadge status={entry.status} /></td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(entry.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {entry.assignedAt ? format(new Date(entry.assignedAt), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && <Pagination page={page} pages={pagination.pages} total={pagination.total} limit={20} onPage={setPage} />}
      </Card>
    </div>
  );
}
