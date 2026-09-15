"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

type User = { name: string; role: string };
const roleCopy: Record<
  string,
  { title: string; description: string; actions: string[] }
> = {
  FARMER: {
    title: "Plan your next harvest",
    description:
      "Find signals that help you get better value for your produce.",
    actions: ["List harvest", "View market demand", "Find a buyer"],
  },
  FPO: {
    title: "Coordinate your collective",
    description: "Bring member supply and buyer demand into one view.",
    actions: ["Add member produce", "Aggregate orders", "Plan dispatch"],
  },
  BUYER: {
    title: "Source fresh produce",
    description: "Match your purchasing needs with reliable local supply.",
    actions: ["Browse supply", "Create demand request", "Track deliveries"],
  },
  CONSUMER: {
    title: "Discover food closer to home",
    description: "Connect with fresh, traceable produce from local growers.",
    actions: ["Explore produce", "View orders", "Save farms"],
  },
  ADMIN: {
    title: "Manage KisanFlow",
    description: "Keep the marketplace healthy and growing.",
    actions: ["Review users", "View network health", "Manage access"],
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("kisanflow_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Your session has ended. Please log in again.");
        const result = await response.json();
        setUser(result.data.user);
      })
      .catch((caught) => {
        localStorage.removeItem("kisanflow_token");
        setError(caught.message);
        setTimeout(() => router.replace("/login"), 1400);
      });
  }, [router]);
  if (error)
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center text-stone-700">
        {error}
      </main>
    );
  if (!user)
    return (
      <main className="grid min-h-screen place-items-center text-leaf-700">
        Loading your workspace…
      </main>
    );
  const content = roleCopy[user.role] || roleCopy.CONSUMER;

  const roleActions: Record<string, { label: string; href: string }[]> = {
    FARMER: [
      { label: "What Should We Grow? (Crop Advisor)", href: "/crop-planning" },
      { label: "Price & Profit Advisor", href: "/price-intelligence" },
      { label: "List harvest produce", href: "/inventory" },
      { label: "View sales & orders", href: "/orders" },
      { label: "Network impact metrics", href: "/impact" },
    ],
    FPO: [
      { label: "What Should We Grow? (Crop Planning)", href: "/crop-planning" },
      { label: "Price Intelligence & Mandi Advisor", href: "/price-intelligence" },
      { label: "Add member produce", href: "/inventory" },
      { label: "Create bulk procurement", href: "/procurement/new" },
      { label: "Orders & dispatch", href: "/orders" },
    ],

    BUYER: [
      { label: "Browse produce supply", href: "/inventory" },
      { label: "Create procurement request", href: "/procurement/new" },
      { label: "Track deliveries & orders", href: "/orders" },
    ],
    CONSUMER: [
      { label: "Explore fresh produce", href: "/inventory" },
      { label: "View active orders", href: "/orders" },
      { label: "Network impact & metrics", href: "/impact" },
    ],
    ADMIN: [
      { label: "Network impact metrics", href: "/impact" },
      { label: "Procurement requests", href: "/procurement/new" },
      { label: "All orders & logistics", href: "/orders" },
    ],
  };

  const actions = roleActions[user.role] || roleActions.CONSUMER;

  const roleBadgeColor: Record<string, string> = {
    FARMER: "bg-emerald-100 text-emerald-800 border-emerald-300",
    FPO: "bg-amber-100 text-amber-800 border-amber-300",
    BUYER: "bg-blue-100 text-blue-800 border-blue-300",
    CONSUMER: "bg-purple-100 text-purple-800 border-purple-300",
    ADMIN: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a className="font-bold text-leaf-900 text-xl flex items-center gap-2" href="/">
            🌾 KisanFlow
          </a>
          <div className="flex items-center gap-4">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                roleBadgeColor[user.role] || "bg-stone-100 text-stone-700"
              }`}
            >
              {user.role}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem("kisanflow_token");
                router.push("/login");
              }}
              className="text-sm font-semibold text-leaf-700 hover:text-leaf-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-center gap-3">
          <span className="eyebrow">{user.role} Workspace</span>
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-leaf-900">
          Hello, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-stone-600">
          {content.description}
        </p>

        <div className="mt-10 rounded-3xl bg-leaf-900 p-8 text-white shadow-lg">
          <p className="text-leaf-100 text-sm font-medium">Your Workspace Quick Actions</p>
          <h2 className="mt-1 text-2xl font-semibold">{content.title}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {actions.map((act) => (
              <a
                href={act.href}
                key={act.label}
                className="group rounded-2xl bg-white/10 p-5 text-left font-semibold transition hover:bg-white/20 hover:scale-[1.02] flex flex-col justify-between min-h-[100px]"
              >
                <span>{act.label}</span>
                <span className="text-right text-leaf-200 group-hover:translate-x-1 transition-transform font-bold">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
