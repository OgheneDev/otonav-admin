"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrderAnalytics, getRiderAnalytics } from "@/lib/api";
import { Card, LoadingSpinner, Select } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Bike } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F97316",
  confirmed: "#3B82F6",
  in_transit: "#10B981",
  delivered: "#00A082",
  cancelled: "#EF4444",
};

interface OrderBreakdown { status: string; count: string | number; }
interface RiderStat {
  riderId: string;
  riderName: string;
  riderEmail: string;
  totalOrders: string | number;
  completedOrders: string | number;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [orderData, setOrderData] = useState<{ total: number; breakdown: OrderBreakdown[] } | null>(null);
  const [riderData, setRiderData] = useState<RiderStat[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRiders, setLoadingRiders] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await getOrderAnalytics(period);
      setOrderData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  }, [period]);

  const loadRiders = async () => {
    setLoadingRiders(true);
    try {
      const res = await getRiderAnalytics();
      setRiderData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRiders(false);
    }
  };

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadRiders(); }, []);

  const barData = orderData?.breakdown.map((b) => ({
    status: b.status.replace(/_/g, " "),
    count: Number(b.count),
    fill: STATUS_COLORS[b.status] || "#9CA3AF",
  })) || [];

  const pieData = barData;

  const topRiders = [...riderData]
    .sort((a, b) => Number(b.totalOrders) - Number(a.totalOrders))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Order Analytics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: "var(--brand-teal)" }} />
          <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Order Analytics</h3>
        </div>
        <Select
          value={period}
          onChange={(v) => setPeriod(v as "week" | "month" | "year")}
          options={[
            { label: "Past Week", value: "week" },
            { label: "Past Month", value: "month" },
            { label: "Past Year", value: "year" },
          ]}
        />
      </div>

      {loadingOrders ? <LoadingSpinner /> : (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white rounded-2xl border p-5 flex flex-col items-center justify-center gap-1" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs uppercase tracking-widest font-mono" style={{ color: "var(--text-muted)" }}>Total Orders</p>
            <p className="font-display text-5xl" style={{ color: "var(--text-primary)" }}>{orderData?.total ?? 0}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{period === "week" ? "Last 7 days" : period === "month" ? "Last 30 days" : "Last year"}</p>
          </div>

          {/* Bar chart */}
          <Card className="md:col-span-2">
            <div className="p-5">
              <p className="text-xs uppercase tracking-widest font-mono mb-4" style={{ color: "var(--text-muted)" }}>By Status</p>
              {barData.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} />
                    <Tooltip
                      contentStyle={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, fontFamily: "var(--font-mono)" }}
                      cursor={{ fill: "var(--bg-subtle)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Pie chart */}
      {!loadingOrders && pieData.length > 0 && (
        <Card title="Distribution">
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, fontFamily: "var(--font-mono)" }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Rider Analytics */}
      <div className="flex items-center gap-2 mt-4">
        <Bike size={18} style={{ color: "var(--brand-red)" }} />
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Rider Performance</h3>
      </div>

      <Card>
        {loadingRiders ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rider</th>
                  <th>Total Assigned</th>
                  <th>Completed</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {topRiders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>No rider data</td></tr>
                ) : (
                  topRiders.map((rider, idx) => {
                    const total = Number(rider.totalOrders);
                    const completed = Number(rider.completedOrders);
                    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <tr key={rider.riderId}>
                        <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                        <td>
                          <div>
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{rider.riderName}</p>
                            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{rider.riderEmail}</p>
                          </div>
                        </td>
                        <td className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{total}</td>
                        <td className="font-mono text-sm" style={{ color: "var(--brand-teal)" }}>{completed}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: rate >= 80 ? "var(--brand-teal)" : rate >= 50 ? "#F97316" : "#EF4444" }} />
                            </div>
                            <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
