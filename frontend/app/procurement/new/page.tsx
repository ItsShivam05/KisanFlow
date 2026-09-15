"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

const products = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Tomato" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Potato" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Onion" },
];

type RequestResult = { id: string; product_name: string; status: string };

type Allocation = {
  best_proposal: {
    rank: number;
    product_cost_inr: number;
    total_landed_cost_inr: number;
    savings_vs_cheapest_single_supplier_inr: number;
    explanation: string;
    suppliers: {
      supplier_id: string;
      name: string;
      allocated_quantity_kg: number;
      price_per_kg: number;
      product_cost_inr: number;
    }[];
  };
  proposals: {
    rank: number;
    product_cost_inr: number;
    total_landed_cost_inr: number;
    explanation: string;
    suppliers: { name: string; allocated_quantity_kg: number; price_per_kg: number }[];
  }[];
};

type MatchResult = {
  matching_summary: string;
  selected_suppliers: {
    name: string;
    allocated_quantity_kg: number;
    price_per_kg: number;
    score: number;
  }[];
};

export default function NewProcurementPage() {
  const router = useRouter();
  const [request,    setRequest]    = useState<RequestResult | null>(null);
  const [match,      setMatch]      = useState<MatchResult | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showAlt,    setShowAlt]    = useState(false);

  const [form, setForm] = useState({
    product_id:            products[0].id,
    requested_quantity_kg: "1000",
    max_price_per_kg:      "",
    quality_requirement:   "B",
    required_by:           new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    destination_name:      "Patna Fresh Mart",
    destination_region:    "Patna",
    destination_latitude:  "25.5941",
    destination_longitude: "85.1376",
  });

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const created = await apiRequest<RequestResult>("/procurement-requests", {
        method: "POST", body: JSON.stringify(form),
      });
      setRequest(created);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create request.");
    } finally { setLoading(false); }
  }

  async function findSuppliers() {
    if (!request) return; setError(""); setLoading(true);
    try {
      const [matchedData, allocData] = await Promise.all([
        apiRequest<MatchResult>(`/procurement-requests/${request.id}/match`, { method: "POST" }),
        apiRequest<Allocation>(`/procurement-requests/${request.id}/optimize-allocation`, { method: "POST" }).catch(() => null),
      ]);
      setMatch(matchedData);
      if (allocData) setAllocation(allocData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to match suppliers.");
    } finally { setLoading(false); }
  }

  async function confirm() {
    if (!request) return; setError(""); setConfirming(true);
    try {
      await apiRequest(`/procurement-requests/${request.id}/confirm`, { method: "POST" });
      router.push("/orders");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to confirm allocation.");
    } finally { setConfirming(false); }
  }

  const productName = products.find((p) => p.id === form.product_id)?.name ?? "Produce";

  return (
    <AppShell backHref="/dashboard" backLabel="Dashboard">
      <div className="mt-6">
        <p className="eyebrow">Procurement</p>
        <h1 className="page-title">Create procurement request</h1>
        <p className="mt-2 text-stone-500">
          Describe your demand. KisanFlow will identify the best available supply,
          then you confirm the allocation.
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 max-w-2xl space-y-6">

        {/* ── Step 1: Request form ── */}
        {!request && (
          <div className="card p-6">
            <h2 className="font-semibold text-stone-900">Step 1 — Describe your demand</h2>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-600">Product</label>
                <select className="field" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-stone-600">Required quantity (kg)</label>
                  <input className="field" required type="number" min="1" placeholder="e.g. 1000"
                    value={form.requested_quantity_kg}
                    onChange={(e) => setForm({ ...form, requested_quantity_kg: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">Max price / kg (₹, optional)</label>
                  <input className="field" type="number" min="1" step="0.01" placeholder="No limit"
                    value={form.max_price_per_kg}
                    onChange={(e) => setForm({ ...form, max_price_per_kg: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-stone-600">Minimum quality grade</label>
                  <select className="field" value={form.quality_requirement} onChange={(e) => setForm({ ...form, quality_requirement: e.target.value })}>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">Required by</label>
                  <input className="field" required type="date" value={form.required_by}
                    onChange={(e) => setForm({ ...form, required_by: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600">Delivery destination</label>
                <input className="field" required placeholder="e.g. Patna Fresh Mart"
                  value={form.destination_name}
                  onChange={(e) => setForm({ ...form, destination_name: e.target.value })} />
              </div>

              <button disabled={loading} className="btn-primary w-full">
                {loading ? "Creating…" : "Create request"}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Find suppliers ── */}
        {request && !match && (
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-100 text-leaf-700 font-bold text-sm">2</div>
              <div>
                <h2 className="font-semibold text-stone-900">Request created</h2>
                <p className="text-sm text-stone-500">{productName} — {form.requested_quantity_kg} kg</p>
              </div>
            </div>
            <button
              onClick={findSuppliers}
              disabled={loading}
              className="btn-primary mt-5 w-full"
            >
              {loading ? "Searching…" : "Find suitable suppliers"}
            </button>
          </div>
        )}

        {/* ── Step 3: Results ── */}
        {match && (
          <>
            {/* Smart Procurement recommendation */}
            {allocation?.best_proposal && (
              <div className="card p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Smart procurement</p>
                    <h2 className="mt-1 text-xl font-semibold text-stone-900">Recommended combination</h2>
                  </div>
                  {allocation.best_proposal.savings_vs_cheapest_single_supplier_inr > 0 && (
                    <span className="badge-green shrink-0">
                      ₹{allocation.best_proposal.savings_vs_cheapest_single_supplier_inr.toFixed(0)} saved
                    </span>
                  )}
                </div>

                {/* Cost cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-medium text-stone-500">Product cost</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">
                      ₹{Number(allocation.best_proposal.product_cost_inr).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-leaf-200 bg-leaf-50 p-4">
                    <p className="text-xs font-medium text-leaf-700">Total landed cost</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">
                      ₹{Number(allocation.best_proposal.total_landed_cost_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">Why this option?</p>
                  <p className="text-sm text-stone-600 leading-relaxed">{allocation.best_proposal.explanation}</p>
                </div>

                {/* Supplier table */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Supplier breakdown</p>
                  <div className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
                    {allocation.best_proposal.suppliers.map((s) => (
                      <div key={s.supplier_id} className="grid grid-cols-3 px-4 py-3 text-sm">
                        <span className="font-medium text-stone-900">{s.name}</span>
                        <span className="text-stone-500">{s.allocated_quantity_kg} kg · ₹{s.price_per_kg}/kg</span>
                        <span className="text-right font-semibold tabular-nums text-stone-900">₹{s.product_cost_inr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternative proposals */}
                {allocation.proposals.length > 1 && (
                  <div>
                    <button
                      onClick={() => setShowAlt(!showAlt)}
                      className="text-sm font-semibold text-leaf-700 hover:text-leaf-900 transition"
                    >
                      {showAlt ? "Hide alternatives" : `View ${allocation.proposals.length - 1} alternative option${allocation.proposals.length > 2 ? "s" : ""}`}
                    </button>
                    {showAlt && (
                      <div className="mt-3 space-y-3">
                        {allocation.proposals.slice(1).map((prop) => (
                          <div key={prop.rank} className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-stone-700">Option {prop.rank}</p>
                              <span className="tabular-nums text-stone-500">
                                ₹{Number(prop.total_landed_cost_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })} landed cost
                              </span>
                            </div>
                            <p className="mt-1.5 text-stone-500 leading-relaxed">{prop.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Matching summary */}
            <div className="card p-6">
              <h3 className="font-semibold text-stone-900">Selected suppliers</h3>
              <p className="mt-1 text-sm text-stone-500">{match.matching_summary}</p>
              <div className="mt-4 divide-y divide-stone-100 rounded-lg border border-stone-200 overflow-hidden">
                {match.selected_suppliers.map((s) => (
                  <div key={s.name} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-medium text-stone-900">{s.name}</span>
                    <span className="text-stone-500">{s.allocated_quantity_kg} kg · ₹{s.price_per_kg}/kg</span>
                    <span className="badge-stone">Score {s.score}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={confirm}
                disabled={confirming}
                className="btn-primary mt-5 w-full"
              >
                {confirming ? "Confirming…" : "Confirm allocation & create orders"}
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
