"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserById } from "@/lib/api";
import { User } from "@/types";
import { StatusBadge, LoadingSpinner, Card, Button } from "@/components/ui";
import { ArrowLeft, Mail, Phone, Building2, Calendar, ShieldCheck } from "lucide-react";
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

  if (loading) return <LoadingSpinner />;
  if (!user) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>User not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft size={14} /> Back
      </Button>

      {/* Header card */}
      <Card>
        <div className="p-6 flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-display shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand-red), #c85c5c)" }}>
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>{user.name || "Unnamed User"}</h2>
              <StatusBadge status={user.role} />
              <StatusBadge status={user.isActive ? "active" : "inactive"} />
              {user.isOtonavRecommended && (
                <span className="badge badge-growth flex items-center gap-1">
                  <ShieldCheck size={11} /> Verified Rider
                </span>
              )}
            </div>
            <p className="text-sm mt-1 font-mono" style={{ color: "var(--text-muted)" }}>{user.id}</p>
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Contact Info">
          <div className="p-5 space-y-4">
            <Detail icon={<Mail size={15} />} label="Email" value={user.email} />
            <Detail icon={<Phone size={15} />} label="Phone" value={user.phoneNumber || "—"} />
            <Detail
              icon={<Calendar size={15} />}
              label="Joined"
              value={format(new Date(user.createdAt), "MMMM d, yyyy")}
            />
            <Detail
              icon={<ShieldCheck size={15} />}
              label="Email Verified"
              value={user.emailVerified ? "Yes" : "No"}
            />
          </div>
        </Card>

        <Card title="Organizations">
          <div className="p-5">
            {!user.organizations?.length ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Not part of any organization.</p>
            ) : (
              <div className="space-y-3">
                {user.organizations.map((org) => (
                  <div key={org.orgId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                    <div className="flex items-center gap-2.5">
                      <Building2 size={15} style={{ color: "var(--text-muted)" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{org.orgName}</p>
                        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{org.role}</p>
                      </div>
                    </div>
                    <StatusBadge status={org.isActive ? "active" : "inactive"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-mono" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}
