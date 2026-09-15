"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { apiRequest } from "@/lib/api";

const roles = [
  { value: "FARMER",   label: "Farmer — I grow and sell produce" },
  { value: "FPO",      label: "FPO — I represent a farmer collective" },
  { value: "BUYER",    label: "Buyer — I procure produce for my business" },
  { value: "CONSUMER", label: "Consumer — I buy produce for personal use" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "FARMER" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await apiRequest<{ token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("kisanflow_token", data.token);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <p className="eyebrow">Join the network</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        Create your KisanFlow account
      </h2>
      <p className="mt-2 text-sm text-stone-500">
        Choose your role to get a workspace designed for you.
      </p>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold text-stone-600" htmlFor="reg-name">
            Full name
          </label>
          <input
            id="reg-name"
            className="field" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-600" htmlFor="reg-email">
            Email address
          </label>
          <input
            id="reg-email"
            className="field" type="email" required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-600" htmlFor="reg-role">
            I am a
          </label>
          <select
            id="reg-role"
            className="field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-600" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            className="field" type="password" minLength={8} required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <a className="font-semibold text-leaf-700 hover:text-leaf-900" href="/login">
          Log in
        </a>
      </p>
    </AuthShell>
  );
}
