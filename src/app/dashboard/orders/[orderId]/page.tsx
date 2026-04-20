"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/lib/api";
import { Order } from "@/types";
import { StatusBadge, LoadingSpinner, Card, Button } from "@/components/ui";
import { ArrowLeft, Package, User, Building2, Bike, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(orderId)
      .then((res) => setOrder(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <LoadingSpinner />;
  if (!order) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Order not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft size={14} /> Back
      </Button>

      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(233,116,116,0.1)", color: "var(--brand-red)" }}>
              <Package size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>
                  #{order.orderNumber}
                </h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>{order.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <InfoItem icon={<Clock size={14} />} label="Created" value={format(new Date(order.createdAt), "MMM d, yyyy · h:mm a")} />
            {order.deliveredAt && (
              <InfoItem icon={<Clock size={14} />} label="Delivered" value={format(new Date(order.deliveredAt), "MMM d, yyyy · h:mm a")} />
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer */}
        <Card title="Customer">
          <div className="p-5 space-y-3">
            {order.customer ? (
              <>
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{order.customer.name}</p>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{order.customer.email}</p>
                {order.customer.phoneNumber && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{order.customer.phoneNumber}</p>}
                <Link href={`/dashboard/users/${order.customer.id}`} className="text-xs hover:underline" style={{ color: "var(--brand-teal)" }}>
                  View profile →
                </Link>
              </>
            ) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No customer data</p>}
          </div>
        </Card>

        {/* Organization */}
        <Card title="Organization">
          <div className="p-5 space-y-3">
            {order.organization ? (
              <>
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{order.organization.name}</p>
                {order.organization.subscriptionPlan && <StatusBadge status={order.organization.subscriptionPlan} />}
                <Link href={`/dashboard/organizations/${order.organization.id}`} className="block text-xs hover:underline" style={{ color: "var(--brand-teal)" }}>
                  View organization →
                </Link>
              </>
            ) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No organization data</p>}
          </div>
        </Card>

        {/* Rider */}
        <Card title="Assigned Rider">
          <div className="p-5 space-y-3">
            {order.rider ? (
              <>
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{order.rider.name}</p>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{order.rider.email}</p>
                <Link href={`/dashboard/users/${order.rider.id}`} className="text-xs hover:underline" style={{ color: "var(--brand-teal)" }}>
                  View profile →
                </Link>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No rider assigned</p>
            )}
          </div>
        </Card>

        {/* Waitlist */}
        {order.waitlistEntry && (
          <Card title="Waitlist Entry">
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Position:</span>
                <span className="font-display text-lg" style={{ color: "var(--brand-teal)" }}>{order.waitlistEntry.position}</span>
              </div>
              <StatusBadge status={order.waitlistEntry.status} />
              {order.waitlistEntry.assignedAt && (
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  Assigned: {format(new Date(order.waitlistEntry.assignedAt), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-mono" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{value}</p>
      </div>
    </div>
  );
}
