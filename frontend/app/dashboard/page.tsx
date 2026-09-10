"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { name: string; role: string };
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const roleCopy: Record<string, { title: string; description: string; actions: string[] }> = {
  FARMER: { title: "Plan your next harvest", description: "Find signals that help you get better value for your produce.", actions: ["List harvest", "View market demand", "Find a buyer"] },
  FPO: { title: "Coordinate your collective", description: "Bring member supply and buyer demand into one view.", actions: ["Add member produce", "Aggregate orders", "Plan dispatch"] },
  BUYER: { title: "Source fresh produce", description: "Match your purchasing needs with reliable local supply.", actions: ["Browse supply", "Create demand request", "Track deliveries"] },
  CONSUMER: { title: "Discover food closer to home", description: "Connect with fresh, traceable produce from local growers.", actions: ["Explore produce", "View orders", "Save farms"] },
  ADMIN: { title: "Manage KisanFlow", description: "Keep the marketplace healthy and growing.", actions: ["Review users", "View network health", "Manage access"] }
};

export default function DashboardPage() {
  const router = useRouter(); const [user, setUser] = useState<User | null>(null); const [error, setError] = useState("");
  useEffect(() => { const token = localStorage.getItem("kisanflow_token"); if (!token) { router.replace("/login"); return; } fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => { if (!response.ok) throw new Error("Your session has ended. Please log in again."); const result = await response.json(); setUser(result.data.user); }).catch((caught) => { localStorage.removeItem("kisanflow_token"); setError(caught.message); setTimeout(() => router.replace("/login"), 1400); }); }, [router]);
  if (error) return <main className="grid min-h-screen place-items-center p-6 text-center text-stone-700">{error}</main>;
  if (!user) return <main className="grid min-h-screen place-items-center text-leaf-700">Loading your workspace…</main>;
  const content = roleCopy[user.role] || roleCopy.CONSUMER;
  return <main className="min-h-screen bg-cream"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a className="font-bold text-leaf-900" href="/">🌾 KisanFlow</a><button onClick={() => { localStorage.removeItem("kisanflow_token"); router.push("/login"); }} className="text-sm font-semibold text-leaf-700">Log out</button></div></header><section className="mx-auto max-w-6xl px-5 py-14"><p className="eyebrow">{user.role} workspace</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-leaf-900">Hello, {user.name.split(" ")[0]}.</h1><p className="mt-4 max-w-xl text-lg text-stone-600">{content.description}</p><div className="mt-10 rounded-3xl bg-leaf-900 p-8 text-white"><p className="text-leaf-100">Your next step</p><h2 className="mt-2 text-2xl font-semibold">{content.title}</h2><div className="mt-7 grid gap-3 sm:grid-cols-3">{content.actions.map((action) => <button key={action} className="rounded-xl bg-white/10 p-4 text-left font-semibold transition hover:bg-white/20">{action} <span aria-hidden>→</span></button>)}</div></div></section></main>;
}
