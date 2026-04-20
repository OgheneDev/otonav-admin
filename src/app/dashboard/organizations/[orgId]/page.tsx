"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrganizationById } from "@/lib/api";
import { Organization } from "@/types";
import { StatusBadge, LoadingSpinner, Card, Button } from "@/components/ui";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Users,
  ShieldAlert,
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

  if (loading) return <LoadingSpinner />;
  if (!org)
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Organization not found.
      </p>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft size={14} /> Back
      </Button>

      {/* Header */}
      <Card>
        <div className="p-6 flex items-start gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(0,160,130,0.1)",
              color: "var(--brand-teal)",
            }}
          >
            <Building2 size={26} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2
                className="font-display text-2xl"
                style={{ color: "var(--text-primary)" }}
              >
                {org.name}
              </h2>
              {org.subscriptionPlan && (
                <StatusBadge status={org.subscriptionPlan} />
              )}
            </div>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {org.id}
            </p>
            {org.address && (
              <p
                className="text-sm mt-2 flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <MapPin size={13} /> {org.address}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Orders",
            value: org.ordersCount ?? 0,
            icon: <Package size={18} />,
            accent: "rgba(233,116,116,0.1)",
            color: "var(--brand-red)",
          },
          {
            label: "Total Members",
            value: org.members?.length ?? 0,
            icon: <Users size={18} />,
            accent: "rgba(0,160,130,0.1)",
            color: "var(--brand-teal)",
          },
          {
            label: "Created",
            value: format(new Date(org.createdAt), "MMM d, yyyy"),
            icon: null,
            accent: "var(--bg-subtle)",
            color: "var(--text-secondary)",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              {m.icon && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: m.accent, color: m.color }}
                >
                  {m.icon}
                </div>
              )}
              <p
                className="text-[10px] uppercase tracking-widest font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </p>
            </div>
            <p className="font-display text-2xl" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Members */}
      <Card title="Members">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Suspended</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {!org.members?.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No members
                  </td>
                </tr>
              ) : (
                org.members.map((m) => (
                  <tr
                    key={m.userId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/users/${m.userId}`)}
                  >
                    <td
                      className="font-medium text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {m.userName}
                    </td>
                    <td className="font-mono text-xs">{m.userEmail}</td>
                    <td>
                      <StatusBadge status={m.role} />
                    </td>
                    <td>
                      <StatusBadge
                        status={m.isActive ? "active" : "inactive"}
                      />
                    </td>
                    <td>
                      {m.isSuspended ? (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "#BE123C" }}
                        >
                          <ShieldAlert size={12} /> Suspended
                        </span>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td
                      className="font-mono text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {format(new Date(m.joinedAt), "MMM d, yyyy")}
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
