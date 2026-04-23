"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getOrgSubscription,
  getOrganizationById,
  adminCreateSubscriptionPayment,
  adminChangePlan,
  adminAddExtraRiders,
  adminCancelSubscription,
  adminReactivateSubscription,
  adminExtendSubscription,
} from "@/lib/api";
import { Card, LoadingSpinner, StatusBadge } from "@/components/ui";
import {
  ArrowLeft,
  CreditCard,
  Users,
  CalendarDays,
  Zap,
  RefreshCw,
  XCircle,
  Plus,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type PlanType = "starter" | "growth" | "pro";

interface SubscriptionData {
  subscription: {
    plan: PlanType | null;
    status: "pending" | "active" | "expired" | null;
    maxRiders: number;
    currentRiderCount: number;
    extraRiders: number;
    hasSetLocationFeature: boolean;
    expiresAt: string | null;
  };
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  paymentDate: string;
  expiresAt: string;
}

interface OrgData {
  id: string;
  name: string;
  address: string;
  ownerUserId: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  growth: "var(--brand-teal)",
  pro: "var(--brand-red)",
};

const PLAN_PRICES: Record<PlanType, number> = {
  starter: 3500,
  growth: 5500,
  pro: 10500,
};

// ─── Reusable confirm modal ───────────────────────────────────────────────────
function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmColor = "var(--brand-red)",
  onConfirm,
  onClose,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: confirmColor, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment link result modal ────────────────────────────────────────────────
function PaymentLinkModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,160,130,0.08)" }}
          >
            <CheckCircle2 size={20} style={{ color: "var(--brand-teal)" }} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Payment Link Ready
            </h3>
            <p className="text-xs text-gray-500">
              Share this with the org owner
            </p>
          </div>
        </div>

        <div
          className="p-3 rounded-xl border text-xs font-mono text-gray-700 break-all"
          style={{ borderColor: "var(--border)", background: "#fafafa" }}
        >
          {url}
        </div>

        <div className="flex gap-3">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: "var(--brand-teal)" }}
          >
            <ExternalLink size={14} />
            Open
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SubscriptionDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();

  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor?: string;
    onConfirm: () => void;
  } | null>(null);

  // Form states
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showAddRiders, setShowAddRiders] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("starter");
  const [extraRiders, setExtraRiders] = useState(0);
  const [immediate, setImmediate] = useState(false);
  const [riderQty, setRiderQty] = useState(1);
  const [extendDays, setExtendDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, orgRes] = await Promise.all([
        getOrgSubscription(orgId),
        getOrganizationById(orgId),
      ]);
      setSubData(subRes.data.data);
      setOrg(orgRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const getPlanColor = (plan: string | null) =>
    plan ? (PLAN_COLORS[plan] ?? "#6b7280") : "#6b7280";

  const formatPlan = (plan: string | null) =>
    plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "None";

  // ─── Action handlers ──────────────────────────────────────────────────────

  const handleCreatePayment = async () => {
    setActionLoading(true);
    try {
      const res = await adminCreateSubscriptionPayment(orgId, {
        plan: selectedPlan,
        extraRiders,
      });
      setPaymentLink(res.data.data.paymentUrl);
      setShowCreatePayment(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create payment link");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async () => {
    setActionLoading(true);
    try {
      const res = await adminChangePlan(orgId, {
        newPlan: selectedPlan,
        extraRiders,
        immediate,
      });
      setPaymentLink(res.data.data.paymentUrl);
      setShowChangePlan(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create plan change link");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRiders = async () => {
    setActionLoading(true);
    try {
      const res = await adminAddExtraRiders(orgId, riderQty);
      setPaymentLink(res.data.data.paymentUrl);
      setShowAddRiders(false);
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Failed to create rider payment link",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmModal({
      title: "Cancel Subscription",
      description:
        "This will immediately cancel the subscription and suspend all riders and customers in this organization. This cannot be undone.",
      confirmLabel: "Yes, Cancel",
      confirmColor: "var(--brand-red)",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await adminCancelSubscription(orgId);
          setConfirmModal(null);
          load();
        } catch (err: any) {
          alert(err.response?.data?.message || "Failed to cancel subscription");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      const res = await adminReactivateSubscription(orgId);
      setPaymentLink(res.data.data.paymentUrl);
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Failed to create reactivation link",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = () => {
    setConfirmModal({
      title: `Extend by ${extendDays} days`,
      description: `This will add ${extendDays} free days to the organization's subscription. An audit log entry will be created.`,
      confirmLabel: "Extend",
      confirmColor: "var(--brand-teal)",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await adminExtendSubscription(orgId, extendDays);
          setConfirmModal(null);
          setShowExtend(false);
          load();
        } catch (err: any) {
          alert(err.response?.data?.message || "Failed to extend subscription");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading)
    return (
      <div className="p-10">
        <LoadingSpinner />
      </div>
    );

  if (!subData || !org)
    return <p className="p-10 text-sm text-gray-500">Not found.</p>;

  const { subscription, recentTransactions } = subData;
  const isActive = subscription.status === "active";
  const isExpired = subscription.status === "expired";
  const isPending = subscription.status === "pending";

  return (
    <div className="space-y-8 max-w-5xl p-2">
      {/* Modals */}
      {paymentLink && (
        <PaymentLinkModal
          url={paymentLink}
          onClose={() => setPaymentLink(null)}
        />
      )}
      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          loading={actionLoading}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Subscriptions
      </button>

      {/* Header Card */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `${getPlanColor(subscription.plan)}12`,
                  color: getPlanColor(subscription.plan),
                }}
              >
                <CreditCard size={28} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl font-medium tracking-tight text-gray-900">
                    {org.name}
                  </h2>
                  {subscription.plan && (
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{
                        color: getPlanColor(subscription.plan),
                        background: `${getPlanColor(subscription.plan)}12`,
                      }}
                    >
                      {formatPlan(subscription.plan)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-400 uppercase tracking-tight">
                  {org.address}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
              <InfoItem
                icon={<Zap size={16} />}
                label="Status"
                value={
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isActive
                        ? "var(--brand-teal)"
                        : isExpired
                          ? "#6b7280"
                          : "#f59e0b",
                    }}
                  >
                    {subscription.status
                      ? subscription.status.charAt(0).toUpperCase() +
                        subscription.status.slice(1)
                      : "—"}
                  </span>
                }
              />
              {subscription.expiresAt && (
                <InfoItem
                  icon={<CalendarDays size={16} />}
                  label={isExpired ? "Expired" : "Expires"}
                  value={format(
                    new Date(subscription.expiresAt),
                    "MMM d, yyyy",
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Max Riders"
          value={String(subscription.maxRiders)}
          sub={`+${subscription.extraRiders} extra`}
        />
        <StatCard
          label="Active Riders"
          value={String(subscription.currentRiderCount)}
          sub={`of ${subscription.maxRiders} slots`}
          highlight={subscription.currentRiderCount >= subscription.maxRiders}
        />
        <StatCard
          label="Set Location"
          value={subscription.hasSetLocationFeature ? "Enabled" : "Disabled"}
          sub="Feature access"
        />
        <StatCard
          label="Transactions"
          value={String(recentTransactions.length)}
          sub="Recent records"
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3
          className="text-[10px] font-mono font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Admin Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Create Payment Link */}
          <ActionCard
            icon={<CreditCard size={16} />}
            title="Create Payment Link"
            description="Initiate a new subscription payment for this org"
            color="#3b82f6"
            disabled={isActive}
            disabledReason="Subscription is already active"
            expanded={showCreatePayment}
            onToggle={() => setShowCreatePayment((v) => !v)}
          >
            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                  Plan
                </span>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                >
                  {(["starter", "growth", "pro"] as PlanType[]).map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)} — ₦
                      {PLAN_PRICES[p].toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                  Extra Riders
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={extraRiders}
                  onChange={(e) => setExtraRiders(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </label>
              <button
                onClick={handleCreatePayment}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  background: "#3b82f6",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Generating…" : "Generate Link"}
              </button>
            </div>
          </ActionCard>

          {/* Change Plan */}
          <ActionCard
            icon={<ArrowUpDown size={16} />}
            title="Change Plan"
            description="Switch org to a different subscription tier"
            color="var(--brand-teal)"
            disabled={!isActive}
            disabledReason="Org must have an active subscription"
            expanded={showChangePlan}
            onToggle={() => setShowChangePlan((v) => !v)}
          >
            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                  New Plan
                </span>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                >
                  {(["starter", "growth", "pro"] as PlanType[]).map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)} — ₦
                      {PLAN_PRICES[p].toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                  Extra Riders
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={extraRiders}
                  onChange={(e) => setExtraRiders(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={immediate}
                  onChange={(e) => setImmediate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-gray-600">
                  Immediate (no proration)
                </span>
              </label>
              <button
                onClick={handleChangePlan}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  background: "var(--brand-teal)",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Generating…" : "Generate Link"}
              </button>
            </div>
          </ActionCard>

          {/* Add Extra Riders */}
          <ActionCard
            icon={<Plus size={16} />}
            title="Add Extra Riders"
            description="Generate payment link to add more rider slots"
            color="var(--brand-teal)"
            disabled={!isActive || subscription.plan === "pro"}
            disabledReason={
              subscription.plan === "pro"
                ? "Pro plan has unlimited riders"
                : "Org must have an active subscription"
            }
            expanded={showAddRiders}
            onToggle={() => setShowAddRiders((v) => !v)}
          >
            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                  Quantity (₦1,000 each)
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={riderQty}
                  onChange={(e) => setRiderQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Total: ₦{(riderQty * 1000).toLocaleString()}
                </span>
              </label>
              <button
                onClick={handleAddRiders}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  background: "var(--brand-teal)",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Generating…" : "Generate Link"}
              </button>
            </div>
          </ActionCard>

          {/* Extend (admin-only, no payment) */}
          <ActionCard
            icon={<Clock size={16} />}
            title="Extend Free Days"
            description="Add days to subscription without payment (comp/fix)"
            color="#f59e0b"
            expanded={showExtend}
            onToggle={() => setShowExtend((v) => !v)}
          >
            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">
                  Days to add
                </span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </label>
              <button
                onClick={handleExtend}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  background: "#f59e0b",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                Extend Subscription
              </button>
            </div>
          </ActionCard>

          {/* Reactivate */}
          {(isExpired || isPending) && (
            <ActionCard
              icon={<RefreshCw size={16} />}
              title="Reactivate"
              description="Generate payment link to reactivate this subscription"
              color="var(--brand-teal)"
            >
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  background: "var(--brand-teal)",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Generating…" : "Generate Reactivation Link"}
              </button>
            </ActionCard>
          )}

          {/* Cancel */}
          {isActive && (
            <ActionCard
              icon={<XCircle size={16} />}
              title="Cancel Subscription"
              description="Immediately cancels and suspends all riders & customers"
              color="var(--brand-red)"
            >
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{
                  background: "var(--brand-red)",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                Cancel Subscription
              </button>
            </ActionCard>
          )}
        </div>
      </div>

      {/* View org link */}
      <div>
        <Link
          href={`/dashboard/organizations/${orgId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          View full organization profile
          <ExternalLink
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* Transaction History */}
      {recentTransactions.length > 0 && (
        <div className="space-y-3">
          <h3
            className="text-[10px] font-mono font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Recent Transactions
          </h3>
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {["Ref", "Plan", "Amount", "Status", "Date"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-gray-900 font-mono"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: "var(--border)" }}
                >
                  {recentTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 max-w-[160px] truncate">
                        {tx.transactionId}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            color: getPlanColor(tx.plan),
                            background: `${getPlanColor(tx.plan)}12`,
                          }}
                        >
                          {tx.plan.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        ₦{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                tx.status === "success"
                                  ? "var(--brand-teal)"
                                  : "var(--brand-red)",
                            }}
                          />
                          {tx.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-900">
                        {format(new Date(tx.paymentDate), "dd MMM, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Card className="border-none shadow-sm bg-white px-5 py-4">
      <p
        className="text-2xl font-medium tracking-tight"
        style={{
          color: highlight ? "var(--brand-red)" : "var(--text-primary)",
        }}
      >
        {value}
      </p>
      <p
        className="text-[10px] font-mono uppercase tracking-widest mt-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </Card>
  );
}

function ActionCard({
  icon,
  title,
  description,
  color,
  disabled = false,
  disabledReason,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  disabled?: boolean;
  disabledReason?: string;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}) {
  const isExpandable = !!onToggle;

  return (
    <div
      className="rounded-2xl border p-5 transition-all"
      style={{
        borderColor: disabled ? "var(--border)" : `${color}25`,
        background: disabled ? "#fafafa" : `${color}05`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        className={`flex items-start gap-3 ${isExpandable && !disabled ? "cursor-pointer" : ""}`}
        onClick={!disabled && isExpandable ? onToggle : undefined}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {disabled && disabledReason ? disabledReason : description}
          </p>
        </div>
        {isExpandable && !disabled && (
          <ChevronDown
            size={16}
            className="text-gray-400 transition-transform shrink-0 mt-1"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        )}
      </div>

      {!disabled && (expanded !== undefined ? expanded : true) && children && (
        <div className="mt-3">{children}</div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest">
          {label}
        </p>
      </div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}
