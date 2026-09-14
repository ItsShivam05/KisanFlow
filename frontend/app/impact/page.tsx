"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

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

export default function ImpactPage() {
  const router = useRouter();
  const [impact, setImpact] = useState<Impact | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("kisanflow_token")) {
      router.replace("/login");
      return;
    }
    void apiRequest<Impact>("/impact")
      .then(setImpact)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load impact metrics",
        ),
      );
  }, [router]);

  return (
    <main className="min-h-screen bg-cream px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <a className="font-bold text-leaf-900" href="/dashboard">
          ← Dashboard
        </a>
        <p className="eyebrow mt-8">Judge view</p>
        <h1 className="mt-2 text-4xl font-semibold text-leaf-900">
          Network impact
        </h1>
        <p className="mt-3 text-stone-600">
          Before-and-after logistics metrics calculated from confirmed KisanFlow
          routes.
        </p>
        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        )}
        {impact && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Metric
                label="Logistics savings"
                value={`₹${Number(impact.logistics_savings).toFixed(0)}`}
              />
              <Metric
                label="Kilometers saved"
                value={`${Number(impact.kilometers_saved).toFixed(1)} km`}
              />
              <Metric
                label="Confirmed orders"
                value={impact.confirmed_orders}
              />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-soft">
                <p className="eyebrow">Before</p>
                <p className="mt-4 text-3xl font-semibold">
                  {Number(impact.baseline_km).toFixed(1)} km
                </p>
                <p className="mt-2 text-stone-500">
                  ₹{Number(impact.baseline_cost).toFixed(0)} estimated logistics
                  cost
                </p>
              </div>
              <div className="rounded-2xl bg-leaf-900 p-6 text-white shadow-soft">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-100">
                  After
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {Number(impact.optimized_km).toFixed(1)} km
                </p>
                <p className="mt-2 text-leaf-100">
                  ₹{Number(impact.optimized_cost).toFixed(0)} optimized
                  logistics cost
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm text-stone-500">{impact.demo_label}</p>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}
