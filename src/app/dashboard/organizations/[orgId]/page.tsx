"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrganizationById } from "@/lib/api";
import { Organization } from "@/types";
import { LoadingSpinner, Card } from "@/components/ui";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Users,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrganizationById(orgId)
      .then((res) => setOrg(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  if (!org)
    return <p className="text-sm text-gray-500 p-8">Organization not found.</p>;

  const isEnterprise = org.subscriptionPlan
    ?.toLowerCase()
    .includes("enterprise");

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Organizations
      </button>

      {/* Profile Header */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] shrink-0">
            <Building2 size={32} />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-2xl text-gray-900 font-medium">{org.name}</h2>
              {org.subscriptionPlan && (
                <span
                  className={`text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border ${
                    isEnterprise
                      ? "border-[var(--brand-teal)] text-[var(--brand-teal)] bg-[var(--brand-teal)]/5"
                      : "border-gray-200 text-gray-600 bg-gray-50"
                  }`}
                >
                  {org.subscriptionPlan.replace(/_/g, " ")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
              <span className="font-mono text-gray-700 text-xs tracking-tight">
                ID: {org.id}
              </span>
              {org.address && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-700" />
                  {org.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Orders"
          value={org.ordersCount ?? 0}
          icon={<Package size={18} />}
          color="var(--brand-red)"
        />
        <MetricCard
          label="Members"
          value={org.members?.length ?? 0}
          icon={<Users size={18} />}
          color="var(--brand-teal)"
        />
        <MetricCard
          label="Est. Date"
          value={format(new Date(org.createdAt), "MMM d, yyyy")}
          icon={<Calendar size={18} />}
          color="gray"
        />
      </div>

      {/* Members Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Registered Members
          </h3>
          <span className="text-xs font-mono text-gray-700">
            {org.members?.length || 0} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700">
                  Role
                </th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-700 text-right">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!org.members?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-700 text-sm italic"
                  >
                    No members assigned to this organization.
                  </td>
                </tr>
              ) : (
                org.members.map((m) => (
                  <tr
                    key={m.userId}
                    className="hover:bg-gray-50/80 cursor-pointer transition-all group"
                    onClick={() => router.push(`/dashboard/users/${m.userId}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-[var(--brand-teal)] transition-colors">
                          {m.userName}
                        </span>
                        {m.isSuspended && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--brand-red)] uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded">
                            <ShieldAlert size={10} /> Suspended
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500">
                        {m.userEmail}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-900 uppercase font-medium">
                        {m.role == "owner" ? "Vendor" : m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-900">
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{
                            background: m.isActive
                              ? "var(--brand-teal)"
                              : "#cbd5e1",
                          }}
                        />
                        {m.isActive ? "Active" : "Disabled"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-mono text-gray-600">
                        {format(new Date(m.joinedAt), "MMM d, yyyy")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const isGray = color === "gray";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: isGray ? "#f8fafc" : `${color}10`,
            color: isGray ? "#64748b" : color,
          }}
        >
          {icon}
        </div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-gray-700 font-mono font-bold">
          {label}
        </p>
      </div>
      <p
        className="text-2xl font-medium tracking-tight"
        style={{ color: isGray ? "#0f172a" : color }}
      >
        {value}
      </p>
    </div>
  );
}
