"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/api";
import { Order, Pagination as PaginationType } from "@/types";
import { Card, Pagination, EmptyState, SkeletonRow } from "@/components/ui";
import { Package } from "lucide-react";
import { format } from "date-fns";

const TABS = [
  { label: "All Orders", value: "all" },
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
      const res = await getOrders({
        page,
        limit: 20,
        status: status !== "all" ? status : undefined,
      });
      setOrders(res.data.data.orders);
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

  const formatStatus = (raw: string) => {
    return raw.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div
        className="flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-8">
          {TABS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className="pb-4 text-sm font-medium transition-all relative"
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
        <p className="text-[10px] tracking-widest mb-4 font-mono text-gray-900">
          {pagination ? `${pagination.total} TOTAL` : ""}
        </p>
      </div>

      <Card className="border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono">
                  Order #
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono">
                  Customer
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono text-right">
                  Created
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<Package size={20} />}
                      title="No orders found"
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs text-gray-900">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-900">
                        {order.customerName || "Guest User"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {order.orgName || "Direct Order"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        {formatStatus(order.status)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-xs text-gray-900">
                      {format(new Date(order.createdAt), "dd MMM, yyyy")}
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
