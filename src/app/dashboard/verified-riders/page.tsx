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
import { ShieldCheck, ShieldX, Plus, Bike, CheckCircle2 } from "lucide-react";
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
    if (!confirm("Remove verification status from this rider?")) return;
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {pagination ? `${pagination.total} verified riders` : ""}
        </p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Add Verified Rider
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rider</th>
                <th>Phone</th>
                <th>Total Assigned</th>
                <th>Completed</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={7} />
                ))
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Bike size={20} />}
                      title="No verified riders"
                      description="Add your first verified rider"
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
                    : null;
                  return (
                    <tr key={rider.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-semibold shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, var(--brand-teal), #007a62)",
                            }}
                          >
                            {rider.name?.charAt(0)?.toUpperCase() || "R"}
                          </div>
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {rider.name || "—"}
                            </p>
                            <p
                              className="text-xs font-mono"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {rider.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs font-mono">
                        {rider.phoneNumber || "—"}
                      </td>
                      <td>
                        <span
                          className="font-mono text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {rider.stats?.totalAssignments ?? 0}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-sm"
                            style={{ color: "var(--brand-teal)" }}
                          >
                            {rider.stats?.completedAssignments ?? 0}
                          </span>
                          {rate !== null && (
                            <span
                              className="text-xs font-mono"
                              style={{ color: "var(--text-muted)" }}
                            >
                              ({rate}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          status={rider.isActive ? "active" : "inactive"}
                        />
                      </td>
                      <td
                        className="font-mono text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {format(new Date(rider.createdAt), "MMM d, yyyy")}
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={removingId === rider.id}
                          onClick={() => handleRemove(rider.id)}
                        >
                          <ShieldX size={13} /> Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            limit={20}
            onPage={setPage}
          />
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

function CreateRiderModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createVerifiedRider(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ email: "", name: "", phoneNumber: "", password: "" });
        onClose();
        onCreated();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create rider.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Verified Rider">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 size={40} style={{ color: "var(--brand-teal)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            Rider created!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <p
              className="text-xs p-3 rounded-xl"
              style={{ background: "#FFF1F2", color: "#BE123C" }}
            >
              {error}
            </p>
          )}
          <Field label="Email *">
            <Input
              value={form.email}
              onChange={set("email")}
              placeholder="rider@email.com"
              type="email"
            />
          </Field>
          <Field label="Full Name">
            <Input
              value={form.name}
              onChange={set("name")}
              placeholder="John Doe"
            />
          </Field>
          <Field label="Phone Number">
            <Input
              value={form.phoneNumber}
              onChange={set("phoneNumber")}
              placeholder="+234…"
            />
          </Field>
          <Field label="Password *">
            <Input
              value={form.password}
              onChange={set("password")}
              type="password"
              placeholder="••••••••"
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              <ShieldCheck size={14} /> Create
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs font-mono uppercase tracking-wider mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
