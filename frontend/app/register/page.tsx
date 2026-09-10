"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const roles = ["FARMER", "FPO", "BUYER", "CONSUMER"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "FARMER" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create your account");
      localStorage.setItem("kisanflow_token", result.data.token); router.push("/dashboard");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create your account"); }
    finally { setLoading(false); }
  }
  return <AuthShell><p className="eyebrow">Join the network</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Create your KisanFlow account</h2><p className="mt-3 text-stone-600">Choose your role to get a workspace designed for you.</p><form className="mt-8 space-y-5" onSubmit={handleSubmit}><label className="block text-sm font-semibold text-stone-700">Full name<input className="field" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label><label className="block text-sm font-semibold text-stone-700">Email<input className="field" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label className="block text-sm font-semibold text-stone-700">I am a<select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map((role) => <option key={role} value={role}>{role[0] + role.slice(1).toLowerCase()}</option>)}</select></label><label className="block text-sm font-semibold text-stone-700">Password<input className="field" type="password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="w-full rounded-full bg-leaf-700 px-5 py-3 font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button></form><p className="mt-7 text-center text-sm text-stone-600">Already have an account? <a className="font-semibold text-leaf-700 hover:text-leaf-900" href="/login">Log in</a></p></AuthShell>;
}
