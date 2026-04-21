"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/api";
import { Order, Pagination as PaginationType } from "@/types";
import { Card, Pagination, EmptyState, SkeletonRow } from "@/components/ui";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
} from "lucide-react";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "var(--brand-red)";
      case "confirmed":
        return "#3b82f6"; // Blue
      case "in_transit":
        return "#f59e0b"; // Amber
      case "delivered":
        return "var(--brand-teal)";
      case "cancelled":
        return "#6b7280"; // Gray
      default:
        return "#000";
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Navigation Tabs - Responsive Scrollable */}
      <div
        className="flex items-center justify-between border-b relative"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar pr-10">
          {TABS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
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

      {/* MOBILE LIST VIEW */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 animate-pulse rounded-2xl"
            />
          ))
        ) : orders.length === 0 ? (
          <EmptyState icon={<Package size={20} />} title="No orders found" />
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-gray-900 block mb-1">
                    #{order.orderNumber}
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                    {format(new Date(order.createdAt), "dd MMM yyyy • HH:mm")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${getStatusColor(order.status)}10`,
                    color: getStatusColor(order.status),
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: getStatusColor(order.status) }}
                  />
                  {formatStatus(order.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {order.customerName || "Guest User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.orgName || "Direct Order"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0" />
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
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} cols={4} />
                  ))
                : orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() =>
                        router.push(`/dashboard/orders/${order.id}`)
                      }
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
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: getStatusColor(order.status) }}
                          />
                          {formatStatus(order.status)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-xs text-gray-900">
                        {format(new Date(order.createdAt), "dd MMM, yyyy")}
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
