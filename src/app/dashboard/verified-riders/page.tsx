"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getVerifiedRiders,
  removeVerifiedRider,
  createVerifiedRider,
} from "@/lib/api";
import { VerifiedRider, Pagination as PaginationType } from "@/types";
import {
  Card,
  StatusBadge,
  Pagination,
  EmptyState,
  SkeletonRow,
  Button,
  Modal,
  Input,
} from "@/components/ui";
import {
  ShieldCheck,
  ShieldX,
  Plus,
  Bike,
  CheckCircle2,
  Phone,
  Mail,
  Eye,
  EyeOff,
  User,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

export default function VerifiedRidersPage() {
  const [riders, setRiders] = useState<VerifiedRider[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVerifiedRiders({ page, limit: 20 });
      setRiders(res.data.data.riders);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (riderId: string) => {
    if (!confirm("Revoke verification? This rider will lose priority status."))
      return;
    setRemovingId(riderId);
    try {
      await removeVerifiedRider(riderId);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-gray-100 pb-6">
        <div>
          <p className="text-xs font-mono text-gray-700 mt-1">
            {pagination
              ? `${pagination.total} Priority Riders Registered`
              : "Loading fleet..."}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gray-900 hover:bg-black text-white"
        >
          <Plus size={16} /> Add Verified Rider
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Rider Identification
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Contact Details
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Assigned
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Success Rate
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={6} />
                ))
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Bike size={32} className="text-gray-200" />}
                      title="Fleet Empty"
                      description="No riders have been granted verification status yet."
                    />
                  </td>
                </tr>
              ) : (
                riders.map((rider) => {
                  const rate = rider.stats?.totalAssignments
                    ? Math.round(
                        (rider.stats.completedAssignments /
                          rider.stats.totalAssignments) *
                          100,
                      )
                    : 0;

                  return (
                    <tr
                      key={rider.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold bg-[var(--brand-teal)] shadow-sm">
                            {rider.name?.charAt(0)?.toUpperCase() || "R"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {rider.name || "Unnamed Rider"}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 tracking-tighter">
                              ID: {rider.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail size={12} className="text-gray-300" />{" "}
                          {rider.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone size={12} className="text-gray-300" />{" "}
                          {rider.phoneNumber || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {rider.stats?.totalAssignments ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--brand-teal)]"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-[var(--brand-teal)]">
                            {rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={rider.isActive ? "active" : "inactive"}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={removingId === rider.id}
                          onClick={() => handleRemove(rider.id)}
                          title="Remove Verified rider"
                          className="text-gray-400 hover:text-[var(--brand-red)] transition-colors p-2 rounded-lg hover:bg-red-50"
                        >
                          {removingId === rider.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <ShieldX size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="border-t border-gray-50 px-6 py-4">
            <Pagination
              page={page}
              pages={pagination.pages}
              total={pagination.total}
              limit={20}
              onPage={setPage}
            />
          </div>
        )}
      </Card>

      <CreateRiderModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </div>
  );
}

function CreateRiderModal({ isOpen, onClose, onCreated }: any) {
  const initialForm = { email: "", name: "", phoneNumber: "", password: "" };
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal visibility changes
  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  const handleChange =
    (k: keyof typeof form) =>
    (v: string | React.ChangeEvent<HTMLInputElement>) => {
      const value = typeof v === "string" ? v : v.target.value;
      setForm((f) => ({ ...f, [k]: value }));
    };

  const validate = () => {
    if (!form.email.includes("@")) return "Please enter a valid email address.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault(); // Prevents page reload on Enter key

    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError("");

    try {
      await createVerifiedRider(form);
      setSuccess(true);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Internal registration error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Rider">
      <div className="p-2">
        {success ? (
          <SuccessState />
        ) : (
          /* Wrap in a form to enable 'Enter' to submit */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-1">
                <ShieldX size={16} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-3">
              <Field label="Full Name">
                <Input
                  icon={<User size={16} />}
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="e.g. Samuel Okafor"
                />
              </Field>

              <Field label="Contact Email *">
                <Input
                  icon={<Mail size={16} />}
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="rider@otonon.com"
                />
              </Field>

              <Field label="Phone Number">
                <Input
                  icon={<Phone size={16} />}
                  value={form.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  placeholder="+234..."
                />
              </Field>

              <Field label="Password *">
                <div className="relative">
                  <Input
                    icon={<Lock size={16} />}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSubmit}
                loading={loading}
                className="flex-1 bg-[var(--brand-teal)] hover:bg-[#007a62] text-white flex justify-center gap-2"
              >
                {!loading && <ShieldCheck size={18} />}
                {loading ? "Registering..." : "Register Rider"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

// Sub-component for a cleaner success view
const SuccessState = () => (
  <div className="flex flex-col items-center gap-4 py-10 text-center animate-in zoom-in-95 duration-300">
    <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-2">
      <CheckCircle2 size={48} strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="text-xl font-semibold text-gray-900">
        Registration Successful
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Rider has been verified and added to the fleet.
      </p>
    </div>
  </div>
);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
