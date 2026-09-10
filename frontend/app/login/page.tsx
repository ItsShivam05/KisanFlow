"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to log in");
      localStorage.setItem("kisanflow_token", result.data.token);
      router.push("/dashboard");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to log in"); }
    finally { setLoading(false); }
  }

  return <AuthShell><p className="eyebrow">Welcome back</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Log in to KisanFlow</h2><p className="mt-3 text-stone-600">Enter your details to access your workspace.</p><form className="mt-8 space-y-5" onSubmit={handleSubmit}><label className="block text-sm font-semibold text-stone-700">Email<input className="field" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label className="block text-sm font-semibold text-stone-700">Password<input className="field" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="w-full rounded-full bg-leaf-700 px-5 py-3 font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-60">{loading ? "Logging in…" : "Log in"}</button></form><p className="mt-7 text-center text-sm text-stone-600">New to KisanFlow? <a className="font-semibold text-leaf-700 hover:text-leaf-900" href="/register">Create an account</a></p></AuthShell>;
}
