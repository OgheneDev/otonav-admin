"use client";

import { useEffect, useState } from "react";
import { getDashboardOverview } from "@/lib/api";
import { DashboardStats, RecentOrder } from "@/types";
import { StatCard, LoadingSpinner, Card } from "@/components/ui";
import {
  Users,
  Building2,
  Package,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { admin } = useAuthStore();

  useEffect(() => {
    getDashboardOverview()
      .then((res) => {
        setStats(res.data.data.stats);
        setRecentOrders(res.data.data.recentOrders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  const humanizeStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-4 md:p-2">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-gray-900 text-center md:text-start">
            Good day, {admin?.name || "Admin"}
          </h2>
          <p className="text-gray-600 mt-1 text-sm text-center md:text-start">
            Overview and performance of the OtoNav network.
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
          <TrendingUp size={14} className="text-[var(--brand-teal)]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-900">
            Live Network Status
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? "—"}
            icon={<Users className="text-blue-500" size={20} />}
          />
          <StatCard
            label="Organizations"
            value={stats?.totalOrganizations ?? "—"}
            icon={<Building2 className="text-[var(--brand-teal)]" size={20} />}
          />
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders ?? "—"}
            icon={<Package className="text-purple-500" size={20} />}
          />
          <StatCard
            label="Pending Action"
            value={stats?.pendingOrders ?? "—"}
            icon={<Clock className="text-[var(--brand-red)]" size={20} />}
          />
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-[var(--brand-teal)]/20 rounded-2xl w-full md:w-fit shadow-sm">
          <div className="bg-[var(--brand-teal)]/10 p-1.5 rounded-lg">
            <ShieldCheck size={18} style={{ color: "var(--brand-teal)" }} />
          </div>
          <span className="text-sm text-gray-900">
            <span className="font-semibold text-[var(--brand-red)]">
              {stats?.verifiedRiders ?? 0}
            </span>{" "}
            Verified Riders active
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders Section */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium uppercase tracking-wider text-gray-900">
              Recent Orders
            </h3>
            <Link
              href="/dashboard/orders"
              className="text-xs text-[var(--brand-teal)] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {/* MOBILE CARDS VIEW (Visible on small screens) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                No recent orders found.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-bold text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background:
                            order.status === "pending"
                              ? "var(--brand-red)"
                              : "var(--brand-teal)",
                        }}
                      />
                      {humanizeStatus(order.status)}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Organization
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.orgName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-mono">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW (Hidden on mobile) */}
          <Card className="hidden md:block border-none shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 text-right">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/80 cursor-pointer transition-all"
                      onClick={() =>
                        router.push(`/dashboard/orders/${order.id}`)
                      }
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.orgName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-900">
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{
                              background:
                                order.status === "pending"
                                  ? "var(--brand-red)"
                                  : "var(--brand-teal)",
                            }}
                          />
                          {humanizeStatus(order.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-600">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-900 px-1">
            Control Center
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: "User Management",
                href: "/dashboard/users",
                desc: "Manage accounts & permissions",
              },
              {
                label: "Order Logistics",
                href: "/dashboard/orders",
                desc: "Track customer order flow",
              },
              {
                label: "Rider Verification",
                href: "/dashboard/verified-riders",
                desc: "Audit delivery personnel",
              },
              {
                label: "System Analytics",
                href: "/dashboard/analytics",
                desc: "Performance & trends",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-5 rounded-2xl border border-gray-100 bg-white hover:border-[var(--brand-teal)] hover:shadow-md hover:shadow-[var(--brand-teal)]/5 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-[var(--brand-teal)] transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-[var(--brand-teal)] group-hover:translate-x-1 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {link.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
