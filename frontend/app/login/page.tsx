"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { apiUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to log in");
      localStorage.setItem("kisanflow_token", result.data.token);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <p className="eyebrow">Welcome back</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        Log in to KisanFlow
      </h2>
      <p className="mt-2 text-sm text-stone-500">
        Enter your details to access your workspace.
      </p>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold text-stone-600" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            className="field"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-600" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="field"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        New to KisanFlow?{" "}
        <a className="font-semibold text-leaf-700 hover:text-leaf-900" href="/register">
          Create an account
        </a>
      </p>
    </AuthShell>
  );
}
