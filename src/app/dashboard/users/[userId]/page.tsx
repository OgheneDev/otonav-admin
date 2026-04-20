"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserById } from "@/lib/api";
import { User } from "@/types";
import { Card, Button, SkeletonRow } from "@/components/ui";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserById(userId)
      .then((res) => setUser(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const formatRole = (role: string) => {
    if (role === "owner") return "Vendor";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading)
    return (
      <div className="p-8">
        <SkeletonRow cols={1} />
      </div>
    );
  if (!user)
    return <p className="text-sm text-gray-500 p-8">User not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Users
      </button>

      {/* Profile Header */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--brand-red), #c85c5c)",
            }}
          >
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-2xl text-gray-900">
                {user.name || "Unnamed User"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-gray-200 text-gray-900">
                  {formatRole(user.role)}
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: user.isActive
                        ? "var(--brand-teal)"
                        : "#94a3b8",
                    }}
                  />
                  <span className="text-sm text-gray-900">
                    {user.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="font-mono text-gray-500 text-xs tracking-tight">
                ID: {user.id}
              </span>
              {user.isOtonavRecommended && (
                <div
                  className="flex items-center gap-1.5"
                  style={{ color: "var(--brand-teal)" }}
                >
                  <ShieldCheck size={14} />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Verified Rider
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Contact Information */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border-none shadow-sm space-y-6">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-gray-400 font-semibold border-b pb-4">
              Contact Details
            </h3>
            <div className="space-y-5">
              <DetailItem
                icon={<Mail size={16} />}
                label="Email Address"
                value={user.email}
                isMono
              />
              <DetailItem
                icon={<Phone size={16} />}
                label="Phone Number"
                value={user.phoneNumber || "Not provided"}
              />
              <DetailItem
                icon={<Calendar size={16} />}
                label="Registration Date"
                value={format(new Date(user.createdAt), "MMMM d, yyyy")}
              />
              <DetailItem
                icon={
                  user.emailVerified ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )
                }
                label="Identity Verification"
                value={
                  user.emailVerified ? "Email Verified" : "Unverified Email"
                }
                color={
                  user.emailVerified ? "var(--brand-teal)" : "var(--brand-red)"
                }
              />
            </div>
          </Card>
        </div>

        {/* Organizations */}
        <div className="md:col-span-3">
          <Card className="p-6 border-none shadow-sm min-h-full">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-gray-400 font-semibold border-b pb-4 mb-6">
              Assigned Organizations
            </h3>
            {!user.organizations?.length ? (
              <div className="py-12 text-center">
                <Building2 size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-500">
                  Not part of any organization.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {user.organizations.map((org) => (
                  <div
                    key={org.orgId}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-gray-200 transition-all bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 font-medium">
                          {org.orgName}
                        </p>
                        <p className="text-[11px] font-mono text-gray-500 uppercase tracking-tighter">
                          {org.role === "owner" ? "Vendor" : org.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-1 rounded-full"
                        style={{
                          background: org.isActive
                            ? "var(--brand-teal)"
                            : "#cbd5e1",
                        }}
                      />
                      <span className="text-xs text-gray-600">
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
  isMono,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isMono?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 text-gray-400 shrink-0" style={{ color: color }}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400 font-mono font-bold">
          {label}
        </p>
        <p
          className={`text-sm text-gray-900 mt-0.5 ${isMono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
