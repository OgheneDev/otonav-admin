"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";

// ── StatusBadge ──────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "badge",
        `badge-${status.toLowerCase().replace(/ /g, "_")}`,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── StatCard ─────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  accent = "teal",
  sub,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "teal" | "red" | "orange" | "purple";
  sub?: string;
}) {
  const accentMap = {
    teal: { bg: "rgba(0,160,130,0.08)", color: "var(--brand-teal)" },
    red: { bg: "rgba(233,116,116,0.08)", color: "var(--brand-red)" },
    orange: { bg: "rgba(249,115,22,0.08)", color: "#F97316" },
    purple: { bg: "rgba(139,92,246,0.08)", color: "#8B5CF6" },
  };
  const a = accentMap[accent];

  return (
    <div
      className="bg-white rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p
            className="text-xs uppercase tracking-widest mb-3 font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          <p className="stat-value">{value}</p>
          {sub && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: a.bg, color: a.color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={clsx("bg-white rounded-2xl border overflow-hidden", className)}
      style={{ borderColor: "var(--border)" }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {title && (
            <h3
              className="font-medium text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className="flex items-center justify-between px-5 py-3 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg transition-all hover:bg-gray-100 disabled:opacity-30"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          let p = i + 1;
          if (pages > 5 && page > 3) p = page - 2 + i;
          if (p > pages) return null;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className="w-7 h-7 rounded-lg text-xs font-mono transition-all"
              style={{
                background: p === page ? "var(--brand-teal)" : "transparent",
                color: p === page ? "white" : "var(--text-secondary)",
              }}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg transition-all hover:bg-gray-100 disabled:opacity-30"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────
export function LoadingSpinner({ text = "Loading…" }: { text?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-16"
      style={{ color: "var(--text-muted)" }}
    >
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--bg-subtle)", color: "var(--text-faint)" }}
      >
        {icon}
      </div>
      <div>
        <p
          className="font-medium text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────
export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const styles = {
    primary: {
      background: "var(--brand-teal)",
      color: "white",
      border: "none",
    },
    secondary: {
      background: "white",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
    danger: {
      background: "#FFF1F2",
      color: "#BE123C",
      border: "1px solid #FDA4AF",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "none",
    },
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-40 flex items-center gap-2",
        sizes[size],
        className,
      )}
      style={styles[variant]}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        "px-3 py-2 rounded-xl text-sm border outline-none transition-all w-full",
        className,
      )}
      style={{
        background: "white",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--brand-teal)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

// ── Select ────────────────────────────────────────────────────
export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "px-3 py-2 rounded-xl text-sm border outline-none cursor-pointer",
        className,
      )}
      style={{
        background: "white",
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border max-h-[90vh] overflow-y-auto"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ── SkeletonRow ───────────────────────────────────────────────
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-3 rounded-full bg-gray-100 animate-pulse"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        </td>
      ))}
    </tr>
  );
}
