"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/api";
import { Order, Pagination as PaginationType } from "@/types";
import { Card, StatusBadge, Pagination, LoadingSpinner, EmptyState, Select, SkeletonRow } from "@/components/ui";
import { Package } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ page, limit: 20, status: status !== "all" ? status : undefined });
      setOrders(res.data.data.orders);
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
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {pagination ? `${pagination.total} total` : ""}
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Created</th>
                <th>Delivered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : orders.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<Package size={20} />} title="No orders found" description="Try adjusting the status filter" /></td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                    <td className="font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>{order.orderNumber}</td>
                    <td className="text-sm">{order.customerName || "—"}</td>
                    <td className="text-sm">{order.orgName || "—"}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {order.deliveredAt ? format(new Date(order.deliveredAt), "MMM d, yyyy") : "—"}
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
