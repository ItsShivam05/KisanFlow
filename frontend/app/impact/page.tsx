"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

type Impact = {
  logistics_savings: string;
  baseline_km: string;
  optimized_km: string;
  kilometers_saved: number;
  baseline_cost: string;
  optimized_cost: string;
  confirmed_orders: string;
  demo_label: string;
};

function pct(before: number, after: number) {
  if (before === 0) return "—";
  return `${(((before - after) / before) * 100).toFixed(0)}% reduction`;
}

export default function ImpactPage() {
  const router  = useRouter();
  const [impact, setImpact] = useState<Impact | null>(null);
  const [error,  setError]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("kisanflow_token")) { router.replace("/login"); return; }
    void apiRequest<Impact>("/impact")
      .then((data) => { setImpact(data); setLoading(false); })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Unable to load impact metrics.");
        setLoading(false);
      });
  }, [router]);

  const baseKm   = impact ? Number(impact.baseline_km)   : 0;
  const optKm    = impact ? Number(impact.optimized_km)  : 0;
  const baseCost = impact ? Number(impact.baseline_cost) : 0;
  const optCost  = impact ? Number(impact.optimized_cost): 0;

  return (
    <AppShell backHref="/dashboard" backLabel="Dashboard">
      <div className="mt-6">
        <p className="eyebrow">Network performance</p>
        <h1 className="page-title">Impact metrics</h1>
        <p className="mt-2 text-stone-500">
          Before-and-after logistics metrics calculated from confirmed KisanFlow routes.
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => window.location.reload()} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-4 w-28" /><div className="skeleton h-8 w-24" /></div>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => <div key={i} className="card p-6 space-y-3"><div className="skeleton h-4 w-20" /><div className="skeleton h-10 w-32" /></div>)}
          </div>
        </div>
      )}

      {impact && (
        <>
          {/* ── Top metrics ── */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Logistics savings</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">
                ₹{Number(impact.logistics_savings).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-xs text-leaf-600">Compared to direct routing</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Distance saved</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">
                {Number(impact.kilometers_saved).toFixed(1)} km
              </p>
              <p className="mt-1 text-xs text-leaf-600">Through consolidated routing</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Confirmed orders</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">
                {impact.confirmed_orders}
              </p>
              <p className="mt-1 text-xs text-leaf-600">Total fulfilled on KisanFlow</p>
            </div>
          </div>

          {/* ── Before vs After ── */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Route distance</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="card p-6">
                <p className="eyebrow !text-stone-400">Before KisanFlow</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-stone-900">
                  {baseKm.toFixed(1)} km
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  ₹{baseCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })} estimated logistics cost
                </p>
              </div>
              <div className="card border-leaf-200 bg-leaf-50 p-6">
                <p className="eyebrow">After KisanFlow</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-leaf-900">
                  {optKm.toFixed(1)} km
                </p>
                <p className="mt-2 text-sm text-leaf-700">
                  ₹{optCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })} optimized cost
                  <span className="ml-2 inline-block badge-green">{pct(baseCost, optCost)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Cost comparison ── */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Cost comparison</h2>
            <div className="mt-3 card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Metric</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Before</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">After</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="px-5 py-3 font-medium text-stone-900">Logistics cost</td>
                    <td className="px-5 py-3 tabular-nums text-stone-600">₹{baseCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3 tabular-nums text-stone-900 font-semibold">₹{optCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3"><span className="badge-green">{pct(baseCost, optCost)}</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-medium text-stone-900">Route distance</td>
                    <td className="px-5 py-3 tabular-nums text-stone-600">{baseKm.toFixed(1)} km</td>
                    <td className="px-5 py-3 tabular-nums text-stone-900 font-semibold">{optKm.toFixed(1)} km</td>
                    <td className="px-5 py-3"><span className="badge-green">{pct(baseKm, optKm)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-5 text-xs text-stone-400">{impact.demo_label}</p>
        </>
      )}
    </AppShell>
  );
}
