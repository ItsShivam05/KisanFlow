"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

type InventoryItem = {
  id: string;
  product_name: string;
  total_quantity_kg: string;
  available_quantity_kg: string;
  asking_price_per_kg: string;
  quality_grade: string;
  harvest_date: string;
  status: string;
};

const products = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Tomato" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Potato" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Onion" },
];

const statusColors: Record<string, string> = {
  AVAILABLE:   "badge-green",
  RESERVED:    "badge-blue",
  SOLD:        "badge-stone",
  UNAVAILABLE: "badge-stone",
};

function relativeDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  } catch {
    return dateStr;
  }
}

export default function InventoryPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* Farmer form */
  const [form, setForm] = useState({
    product_id: products[0].id,
    total_quantity_kg: "",
    asking_price_per_kg: "",
    quality_grade: "A",
    harvest_date: new Date().toISOString().slice(0, 10),
    region: "Patna",
  });

  /* Buyer procurement form */
  const [buyForm, setBuyForm] = useState({
    product_id: products[0].id,
    requested_quantity_kg: "50",
  });
  const [buyRequest, setBuyRequest]     = useState<any>(null);
  const [buyAllocation, setBuyAllocation] = useState<any>(null);
  const [buying, setBuying]             = useState(false);

  async function load() {
    try {
      const data = await apiRequest<InventoryItem[]>("/inventory");
      setItems(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("kisanflow_token")) { router.replace("/login"); return; }
    void apiRequest<{ user: { role: string } }>("/auth/me")
      .then((data) => setUserRole(data.user.role))
      .catch(() => {});
    void load();
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setMessage(""); setSubmitting(true);
    try {
      await apiRequest("/inventory", { method: "POST", body: JSON.stringify(form) });
      setMessage("Produce listed successfully.");
      setForm({ ...form, total_quantity_kg: "", asking_price_per_kg: "" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to list produce.");
    } finally {
      setSubmitting(false);
    }
  }

  const canList = userRole === "FARMER" || userRole === "FPO";

  return (
    <AppShell backHref="/dashboard" backLabel="Dashboard">
      <div className="mt-6">
        <p className="eyebrow">{canList ? "Your inventory" : "Marketplace"}</p>
        <h1 className="page-title">{canList ? "My produce" : "Available supply"}</h1>
        <p className="mt-2 text-stone-500">
          {canList
            ? "List your available harvest so buyers can find and purchase it."
            : "Browse available lots from farmers and FPOs. Use smart procurement to optimise your order."}
        </p>
      </div>

      <div className={`mt-8 grid gap-8 ${canList ? "lg:grid-cols-[360px_1fr]" : ""}`}>

        {/* ── LEFT: Farmer form OR Buyer procurement widget ── */}
        {canList ? (
          <section>
            <div className="card p-6">
              <h2 className="font-semibold text-stone-900">List produce</h2>
              <p className="mt-1 text-sm text-stone-500">Add a new lot to the marketplace.</p>

              {/* Market signal (no AI branding) */}
              <div className="mt-4 rounded-lg border border-leaf-200 bg-leaf-50 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-leaf-900 text-xs uppercase tracking-wider">Market signal — Tomato, Patna</p>
                  <a href="/price-intelligence" className="text-xs font-semibold text-leaf-700 hover:underline">
                    Price Advisor →
                  </a>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-stone-600">Suggested price</span>
                  <span className="font-semibold text-stone-900">₹34/kg</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-stone-600">7-day demand</span>
                  <span className="font-semibold text-stone-900">34,398 kg</span>
                </div>
                <div className="border-t border-leaf-200/60 pt-2 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Unsure what to cultivate next?</span>
                  <a href="/crop-planning" className="font-semibold text-leaf-700 hover:underline">
                    What to grow →
                  </a>
                </div>
              </div>

              <form onSubmit={submit} className="mt-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600">Product</label>
                  <select
                    className="field"
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  >
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-600">Quantity (kg)</label>
                    <input
                      className="field" required type="number" min="1"
                      placeholder="e.g. 500"
                      value={form.total_quantity_kg}
                      onChange={(e) => setForm({ ...form, total_quantity_kg: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600">Price / kg (₹)</label>
                    <input
                      className="field" required type="number" min="1" step="0.01"
                      placeholder="e.g. 27"
                      value={form.asking_price_per_kg}
                      onChange={(e) => setForm({ ...form, asking_price_per_kg: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-600">Quality grade</label>
                    <select className="field" value={form.quality_grade} onChange={(e) => setForm({ ...form, quality_grade: e.target.value })}>
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                      <option value="C">Grade C</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600">Harvest date</label>
                    <input className="field" required type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} />
                  </div>
                </div>

                <button disabled={submitting} className="btn-primary w-full mt-1">
                  {submitting ? "Listing…" : "Add produce"}
                </button>
                {message && <p className="text-sm text-leaf-700">{message}</p>}
                {error    && <p className="text-sm text-red-600">{error}</p>}
              </form>
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            {/* Smart Procurement Widget */}
            <div className="card p-6">
              <div>
                <p className="eyebrow">Smart procurement</p>
                <h2 className="mt-1 text-xl font-semibold text-stone-900">Find the best supply combination</h2>
                <p className="mt-1.5 text-sm text-stone-500">
                  Enter your demand below. KisanFlow will identify the lowest total landed cost
                  across available suppliers, including partial allocations.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(""); setBuying(true); setBuyAllocation(null); setBuyRequest(null);
                  try {
                    const req = await apiRequest<{ id: string; product_name: string }>(
                      "/procurement-requests",
                      {
                        method: "POST",
                        body: JSON.stringify({
                          product_id: buyForm.product_id,
                          requested_quantity_kg: buyForm.requested_quantity_kg,
                          quality_requirement: "B",
                          required_by: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
                          destination_name: `${userRole || "Buyer"} Destination`,
                          destination_region: "Patna",
                          destination_latitude: "25.5941",
                          destination_longitude: "85.1376",
                        }),
                      }
                    );
                    setBuyRequest(req);
                    const [, allocData] = await Promise.all([
                      apiRequest<any>(`/procurement-requests/${req.id}/match`, { method: "POST" }),
                      apiRequest<any>(`/procurement-requests/${req.id}/optimize-allocation`, { method: "POST" }).catch(() => null),
                    ]);
                    setBuyAllocation(allocData);
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "Unable to calculate allocation.");
                  } finally {
                    setBuying(false);
                  }
                }}
                className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <div>
                  <label className="text-xs font-semibold text-stone-600">Product</label>
                  <select className="field" value={buyForm.product_id} onChange={(e) => setBuyForm({ ...buyForm, product_id: e.target.value })}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">Quantity needed (kg)</label>
                  <input
                    className="field" required type="number" min="1"
                    placeholder="e.g. 50"
                    value={buyForm.requested_quantity_kg}
                    onChange={(e) => setBuyForm({ ...buyForm, requested_quantity_kg: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <button disabled={buying} className="btn-primary w-full sm:w-auto">
                    {buying ? "Calculating…" : "Find supply"}
                  </button>
                </div>
              </form>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            {/* Allocation Result */}
            {buyAllocation?.best_proposal && (
              <div className="card border-leaf-200 p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Recommended combination</p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-900">Optimal supply plan</h3>
                  </div>
                  {buyAllocation.best_proposal.savings_vs_cheapest_single_supplier_inr > 0 && (
                    <span className="badge-green shrink-0">
                      ₹{buyAllocation.best_proposal.savings_vs_cheapest_single_supplier_inr.toFixed(0)} saved vs single supplier
                    </span>
                  )}
                </div>

                {/* Cost breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                    <p className="text-xs font-medium text-stone-500">Product cost</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">₹{buyAllocation.best_proposal.product_cost_inr}</p>
                  </div>
                  <div className="rounded-lg bg-leaf-50 border border-leaf-200 p-4">
                    <p className="text-xs font-medium text-leaf-700">Total landed cost</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">₹{buyAllocation.best_proposal.total_landed_cost_inr.toFixed(0)}</p>
                  </div>
                </div>

                {/* Why this option */}
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 leading-relaxed">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">Why this combination?</p>
                  {buyAllocation.best_proposal.explanation}
                </div>

                {/* Supplier breakdown */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Suppliers selected</p>
                  <div className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white overflow-hidden">
                    {buyAllocation.best_proposal.suppliers.map((s: any) => (
                      <div key={s.supplier_id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="font-medium text-stone-900">{s.name}</span>
                        <span className="text-stone-500">
                          {s.allocated_quantity_kg} kg · ₹{s.price_per_kg}/kg
                        </span>
                        <span className="font-semibold tabular-nums text-stone-900">₹{s.product_cost_inr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!buyRequest) return;
                    try {
                      await apiRequest(`/procurement-requests/${buyRequest.id}/confirm`, { method: "POST" });
                      router.push("/orders");
                    } catch {
                      setError("Failed to confirm order. Please try again.");
                    }
                  }}
                  className="btn-primary w-full"
                >
                  Confirm purchase & place order
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── RIGHT: Available lots table ── */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-stone-900">Available lots</h2>
            <span className="text-sm text-stone-400">{items.length} listing{items.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
              <p className="font-medium text-stone-900">No produce listed yet</p>
              <p className="mt-1 text-sm text-stone-500">
                {canList ? "Add your first lot using the form." : "Farmers will list produce here."}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-stone-900">{item.product_name}</h3>
                      <p className="mt-0.5 text-xs text-stone-400">
                        Harvested {relativeDate(item.harvest_date)} · Grade {item.quality_grade}
                      </p>
                    </div>
                    <span className={statusColors[item.status] || "badge-stone"}>
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-stone-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-stone-400">Available</p>
                      <p className="mt-0.5 font-semibold tabular-nums">{Number(item.available_quantity_kg).toLocaleString("en-IN")} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Total listed</p>
                      <p className="mt-0.5 font-semibold tabular-nums">{Number(item.total_quantity_kg).toLocaleString("en-IN")} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Asking price</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-leaf-700">₹{item.asking_price_per_kg}/kg</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
