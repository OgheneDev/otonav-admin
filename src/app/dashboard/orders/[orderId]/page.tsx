"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/lib/api";
import { Order } from "@/types";
import { StatusBadge, LoadingSpinner, Card } from "@/components/ui";
import {
  ArrowLeft,
  Package,
  User,
  Building2,
  Bike,
  Clock,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { OrderTrackingModal } from "@/components/OrderTrackingModal";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  useEffect(() => {
    getOrderById(orderId)
      .then((res) => setOrder(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading)
    return (
      <div className="p-10">
        <LoadingSpinner />
      </div>
    );
  if (!order)
    return <p className="p-10 text-sm text-gray-500">Order not found.</p>;

  // Get userId from customer or organization
  const userId = order.customer?.id || order.organization?.id || "";

  return (
    <>
      <div className="space-y-8 max-w-5xl p-2">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Orders
        </button>

        {/* Primary Header Card */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--brand-red)]/10 text-[var(--brand-red)] shrink-0">
                  <Package size={32} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-medium tracking-tight text-gray-900">
                      Order #{order.orderNumber}
                    </h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-tight">
                    Internal ID: {order.id}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                <InfoItem
                  icon={<Clock size={16} />}
                  label="Initiated"
                  value={format(
                    new Date(order.createdAt),
                    "MMM d, yyyy · h:mm a",
                  )}
                />
                {order.deliveredAt && (
                  <InfoItem
                    icon={
                      <div className="w-2 h-2 rounded-full bg-[var(--brand-teal)]" />
                    }
                    label="Completed"
                    value={format(
                      new Date(order.deliveredAt),
                      "MMM d, yyyy · h:mm a",
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Track Order Button - Only show for in_transit orders */}
        {order.status === "in_transit" && (
          <div className="flex justify-end">
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#E97474] text-white rounded-xl hover:bg-[#E97474]/90 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              <MapPin size={20} />
              <span className="font-semibold">Track Order</span>
            </button>
          </div>
        )}

        {/* Stakeholder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Section */}
          <StakeholderCard
            title="Customer"
            icon={<User size={18} />}
            data={order.customer}
            href={
              order.customer ? `/dashboard/users/${order.customer.id}` : null
            }
          />

          {/* Organization Section */}
          <StakeholderCard
            title="Organization"
            icon={<Building2 size={18} />}
            data={order.organization}
            href={
              order.organization
                ? `/dashboard/organizations/${order.organization.id}`
                : null
            }
            isOrg
          />

          {/* Rider Section */}
          <StakeholderCard
            title="Assigned Rider"
            icon={<Bike size={18} />}
            data={order.rider}
            href={order.rider ? `/dashboard/users/${order.rider.id}` : null}
            emptyText="Awaiting Assignment"
          />
        </div>

        {/* Logistics/Waitlist Information */}
        {order.waitlistEntry && (
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                Queue Intelligence
              </h3>
            </div>
            <div className="p-8 flex items-center gap-12">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Priority Position
                </p>
                <p className="text-4xl font-medium text-[var(--brand-teal)] tracking-tighter">
                  {order.waitlistEntry.position.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="h-12 w-px bg-gray-100" />
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Waitlist Status
                </p>
                <StatusBadge status={order.waitlistEntry.status} />
              </div>
              {order.waitlistEntry.assignedAt && (
                <div className="hidden sm:block space-y-1">
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                    Entry Assigned
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {format(
                      new Date(order.waitlistEntry.assignedAt),
                      "MMM d, yyyy",
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Order Tracking Modal - Your original modal with map */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        order={order}
        userId={userId}
      />
    </>
  );
}

function StakeholderCard({
  title,
  icon,
  data,
  href,
  isOrg = false,
  emptyText = "No data available",
}: any) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden p-6 flex flex-col justify-between min-h-[180px]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-400">
          {icon}
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]">
            {title}
          </h3>
        </div>

        {data ? (
          <div className="space-y-1">
            <p className="text-base font-medium text-gray-900 leading-tight">
              {data.name}
            </p>
            <p className="text-xs font-mono text-gray-500 truncate">
              {data.email || data.address || "—"}
            </p>
            {isOrg && data.subscriptionPlan && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[var(--brand-teal)] border border-[var(--brand-teal)]/20 bg-[var(--brand-teal)]/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                  {data.subscriptionPlan.replace("_", " ")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-gray-300">{emptyText}</p>
        )}
      </div>

      {href && data && (
        <Link
          href={href}
          className="mt-6 flex items-center justify-between text-xs font-medium text-gray-900 group hover:text-[var(--brand-teal)] transition-colors"
        >
          Detailed Profile
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      )}
    </Card>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
