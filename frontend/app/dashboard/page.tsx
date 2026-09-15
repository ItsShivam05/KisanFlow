"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

type User = { name: string; role: string };

/* ── Role-specific copy ── */
const roleCopy: Record<string, { greeting: string; description: string }> = {
  FARMER: {
    greeting: "Good to see you",
    description: "Manage your produce, track orders, and stay ahead of market demand.",
  },
  FPO: {
    greeting: "Good to see you",
    description: "Coordinate your collective's supply, aggregate orders, and plan dispatch.",
  },
  BUYER: {
    greeting: "Good to see you",
    description: "Source fresh produce, manage procurement requests, and track deliveries.",
  },
  CONSUMER: {
    greeting: "Good to see you",
    description: "Explore fresh, traceable produce from local growers.",
  },
  ADMIN: {
    greeting: "Welcome",
    description: "Monitor the KisanFlow network, manage users, and review impact.",
  },
};

/* ── Role-specific quick actions ── */
const roleActions: Record<string, { label: string; description: string; href: string }[]> = {
  FARMER: [
    { label: "My produce", description: "List and manage your harvest inventory", href: "/inventory" },
    { label: "Orders", description: "View and update your sales orders", href: "/orders" },
    { label: "Network impact", description: "See how KisanFlow is working for you", href: "/impact" },
  ],
  FPO: [
    { label: "Member produce", description: "Add and manage collective inventory", href: "/inventory" },
    { label: "Procurement", description: "Create bulk procurement requests", href: "/procurement/new" },
    { label: "Orders & dispatch", description: "Track and manage all orders", href: "/orders" },
  ],
  BUYER: [
    { label: "Browse supply", description: "See available produce from farmers", href: "/inventory" },
    { label: "New procurement", description: "Create a procurement request", href: "/procurement/new" },
    { label: "Orders & delivery", description: "Track your active orders", href: "/orders" },
  ],
  CONSUMER: [
    { label: "Explore produce", description: "Browse fresh produce near you", href: "/inventory" },
    { label: "My orders", description: "View your order history", href: "/orders" },
    { label: "Impact metrics", description: "See KisanFlow's network impact", href: "/impact" },
  ],
  ADMIN: [
    { label: "Impact metrics", description: "Network performance and savings", href: "/impact" },
    { label: "Procurement", description: "Review procurement requests", href: "/procurement/new" },
    { label: "All orders", description: "Monitor all orders and logistics", href: "/orders" },
  ],
};

const roleBadge: Record<string, string> = {
  FARMER:   "bg-leaf-50 text-leaf-700 border-leaf-200",
  FPO:      "bg-amber-50 text-amber-700 border-amber-200",
  BUYER:    "bg-blue-50 text-blue-700 border-blue-200",
  CONSUMER: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN:    "bg-rose-50 text-rose-700 border-rose-200",
};

const roleLabel: Record<string, string> = {
  FARMER:   "Farmer",
  FPO:      "FPO",
  BUYER:    "Buyer",
  CONSUMER: "Consumer",
  ADMIN:    "Admin",
};

/* ── Market signal cards (static demo data) ── */
const marketCards = [
  { label: "Market demand", crop: "Tomato (Patna)", value: "34,398 kg", sub: "Expected over 7 days", accent: "text-stone-900" },
  { label: "Price guidance", crop: "Tomato spot price", value: "₹34/kg", sub: "Patna APMC estimate", accent: "text-stone-900" },
  { label: "Freshness priority", crop: "Current batch", value: "High", sub: "Dispatch recommended soon", accent: "text-amber-700" },
];

/* ───────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("kisanflow_token");
    if (!token) { router.replace("/login"); return; }
    fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Your session has ended. Please log in again.");
        const result = await res.json();
        setUser(result.data.user);
      })
      .catch((caught) => {
        localStorage.removeItem("kisanflow_token");
        setError(caught.message);
        setTimeout(() => router.replace("/login"), 1400);
      });
  }, [router]);

  /* Loading */
  if (!user && !error) {
    return (
      <main className="grid min-h-screen place-items-center bg-sand">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-leaf-600 border-t-transparent" />
          <p className="text-sm">Loading your workspace…</p>
        </div>
      </main>
    );
  }

  /* Error */
  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-sand p-6 text-center">
        <p className="text-stone-600">{error}</p>
      </main>
    );
  }

  const content  = roleCopy[user!.role]    || roleCopy.CONSUMER;
  const actions  = roleActions[user!.role] || roleActions.CONSUMER;
  const firstName = user!.name.split(" ")[0];

  return (
    <main className="min-h-screen bg-sand">
      {/* ── Top bar ── */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 font-bold text-stone-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-700 text-xs font-bold text-white">K</span>
            KisanFlow
          </a>

          {/* Nav links */}
          <nav className="hidden items-center gap-5 md:flex">
            <a href="/inventory" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition">Inventory</a>
            <a href="/procurement/new" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition">Procurement</a>
            <a href="/orders" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition">Orders</a>
            <a href="/impact" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition">Impact</a>
          </nav>

          {/* User / logout */}
          <div className="flex items-center gap-3">
            <span className={`badge border ${roleBadge[user!.role] || "bg-stone-100 text-stone-600 border-stone-200"}`}>
              {roleLabel[user!.role] || user!.role}
            </span>
            <button
              onClick={() => { localStorage.removeItem("kisanflow_token"); router.push("/login"); }}
              className="text-sm font-medium text-stone-500 transition hover:text-stone-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">

        {/* Greeting */}
        <div>
          <p className="eyebrow">{content.greeting}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            {firstName}.
          </h1>
          <p className="mt-2 text-stone-500">{content.description}</p>
        </div>

        {/* ── Quick actions ── */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Quick actions
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {actions.map((act) => (
              <a
                key={act.label}
                href={act.href}
                className="group card flex flex-col justify-between p-5 transition hover:border-leaf-200 hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-stone-900">{act.label}</p>
                  <p className="mt-1 text-sm text-stone-500">{act.description}</p>
                </div>
                <span className="mt-4 text-sm font-semibold text-leaf-700 transition group-hover:underline">
                  Open →
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Market signals (contextual, not "AI branding") ── */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Market signals
            </h2>
            <span className="text-xs text-stone-400">Updated regularly</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {marketCards.map((mc) => (
              <div key={mc.label} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{mc.label}</p>
                <p className="mt-1 text-xs text-stone-500">{mc.crop}</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${mc.accent}`}>{mc.value}</p>
                <p className="mt-1 text-xs text-stone-500">{mc.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Role-specific recommendation ── */}
        {(user!.role === "FARMER" || user!.role === "FPO") && (
          <section className="mt-6">
            <div className="card border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Recommendation</p>
              <p className="mt-2 font-semibold text-stone-900">Consider dispatching produce soon</p>
              <p className="mt-1 text-sm text-stone-600">
                Current market demand is high for Tomatoes in the Patna region.
                Listings dispatched in the next 2 days are likely to clear at ₹34/kg.
              </p>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
