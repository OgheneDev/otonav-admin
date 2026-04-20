"use client";

import { useEffect, useState } from "react";
import { getDashboardOverview } from "@/lib/api";
import { DashboardStats, RecentOrder } from "@/types";
import { StatCard, StatusBadge, LoadingSpinner } from "@/components/ui";
import {
  Users,
  Building2,
  Package,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardOverview()
      .then((res) => {
        setStats(res.data.data.stats);
        setRecentOrders(res.data.data.recentOrders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="font-display text-3xl text-gray-900 leading-none">
          Good day
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          Here's what's happening across OtoNav.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? "—"}
          icon={<Users size={20} />}
          accent="teal"
        />
        <StatCard
          label="Organizations"
          value={stats?.totalOrganizations ?? "—"}
          icon={<Building2 size={20} />}
          accent="red"
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? "—"}
          icon={<Package size={20} />}
          accent="orange"
        />
        <StatCard
          label="Pending Orders"
          value={stats?.pendingOrders ?? "—"}
          icon={<Clock size={20} />}
          accent="purple"
          sub="Awaiting assignment"
        />
        <StatCard
          label="Verified Riders"
          value={stats?.verifiedRiders ?? "—"}
          icon={<ShieldCheck size={20} />}
          accent="teal"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Manage Users",
            href: "/dashboard/users",
            color: "var(--brand-teal)",
          },
          {
            label: "View Orders",
            href: "/dashboard/orders",
            color: "var(--brand-red)",
          },
          {
            label: "Verified Riders",
            href: "/dashboard/verified-riders",
            color: "#F97316",
          },
          {
            label: "Analytics",
            href: "/dashboard/analytics",
            color: "#8B5CF6",
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-4 py-3 rounded-xl border bg-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md group"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {link.label}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
              style={{ color: link.color }}
            />
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3
            className="font-medium text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Orders
          </h3>
          <Link
            href="/dashboard/orders"
            className="text-xs font-medium flex items-center gap-1 hover:underline"
            style={{ color: "var(--brand-teal)" }}
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/dashboard/orders/${order.id}`)
                    }
                  >
                    <td className="font-mono text-xs">{order.orderNumber}</td>
                    <td>{order.orgName}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="font-mono text-xs">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
