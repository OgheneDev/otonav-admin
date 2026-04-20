"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      const { accessToken, admin } = res.data.data;
      setAuth(admin, accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#F8F8F6" }}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: "var(--brand-red)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: "var(--brand-teal)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.02]"
          style={{ background: "conic-gradient(from 0deg, var(--brand-red), var(--brand-teal), var(--brand-red))" }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative w-full max-w-md px-6 page-enter">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--brand-red), #c85c5c)" }}>
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-gray-900 mb-1">OtoNav</h1>
          <p className="text-xs tracking-[0.25em] uppercase" style={{ color: "var(--text-muted)" }}>
            Admin Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border p-8" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Sign in to access the administration panel.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm" style={{ background: "#FFF1F2", color: "#BE123C", border: "1px solid #FDA4AF" }}>
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@otonav.com"
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all"
                style={{
                  background: "var(--bg-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand-teal)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm border outline-none transition-all"
                  style={{
                    background: "var(--bg-subtle)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--brand-teal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-medium transition-all mt-2 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--brand-red), #c85c5c)" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-faint)" }}>
          OtoNav Admin v1.0 · Restricted Access
        </p>
      </div>
    </div>
  );
}
