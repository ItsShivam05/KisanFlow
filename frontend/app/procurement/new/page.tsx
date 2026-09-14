"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const products = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Tomato" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Potato" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Onion" },
];
type RequestResult = { id: string; product_name: string; status: string };

export default function NewProcurementPage() {
  const router = useRouter();
  const [request, setRequest] = useState<RequestResult | null>(null);
  const [match, setMatch] = useState<{
    matching_summary: string;
    selected_suppliers: {
      name: string;
      allocated_quantity_kg: number;
      price_per_kg: number;
      score: number;
    }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    product_id: products[0].id,
    requested_quantity_kg: "1000",
    max_price_per_kg: "",
    quality_requirement: "B",
    required_by: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    destination_name: "Patna Fresh Mart",
    destination_region: "Patna",
    destination_latitude: "25.5941",
    destination_longitude: "85.1376",
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const created = await apiRequest<RequestResult>("/procurement-requests", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setRequest(created);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create request",
      );
    }
  }
  async function findSuppliers() {
    if (!request) return;
    setError("");
    try {
      setMatch(
        await apiRequest<typeof match>(
          `/procurement-requests/${request.id}/match`,
          { method: "POST" },
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to match suppliers",
      );
    }
  }
  async function confirm() {
    if (!request) return;
    try {
      await apiRequest(`/procurement-requests/${request.id}/confirm`, {
        method: "POST",
      });
      router.push("/orders");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to confirm allocation",
      );
    }
  }
  return (
    <main className="min-h-screen bg-cream px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <a className="font-bold text-leaf-900" href="/dashboard">
          ← Dashboard
        </a>
        <h1 className="mt-8 text-4xl font-semibold text-leaf-900">
          Create procurement request
        </h1>
        <p className="mt-3 text-stone-600">
          Describe demand, review the transparent match, then confirm a
          protected allocation.
        </p>
        {!request && (
          <form
            onSubmit={submit}
            className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-soft"
          >
            <select
              className="field"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              className="field"
              required
              type="number"
              min="1"
              placeholder="Required quantity (kg)"
              value={form.requested_quantity_kg}
              onChange={(e) =>
                setForm({ ...form, requested_quantity_kg: e.target.value })
              }
            />
            <input
              className="field"
              type="number"
              min="1"
              step="0.01"
              placeholder="Maximum price per kg (optional)"
              value={form.max_price_per_kg}
              onChange={(e) =>
                setForm({ ...form, max_price_per_kg: e.target.value })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="field"
                value={form.quality_requirement}
                onChange={(e) =>
                  setForm({ ...form, quality_requirement: e.target.value })
                }
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
              <input
                className="field"
                required
                type="date"
                value={form.required_by}
                onChange={(e) =>
                  setForm({ ...form, required_by: e.target.value })
                }
              />
            </div>
            <input
              className="field"
              required
              placeholder="Destination name"
              value={form.destination_name}
              onChange={(e) =>
                setForm({ ...form, destination_name: e.target.value })
              }
            />
            <button className="w-full rounded-xl bg-leaf-700 px-4 py-3 font-semibold text-white">
              Create request
            </button>
          </form>
        )}
        {request && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-soft">
            <p className="eyebrow">Request {request.status}</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {request.product_name} demand is ready
            </h2>
            {!match ? (
              <button
                onClick={findSuppliers}
                className="mt-6 rounded-xl bg-leaf-700 px-4 py-3 font-semibold text-white"
              >
                Find suitable suppliers
              </button>
            ) : (
              <>
                <p className="mt-5 text-stone-700">{match.matching_summary}</p>
                <div className="mt-5 space-y-3">
                  {match.selected_suppliers.map((supplier) => (
                    <div
                      className="flex items-center justify-between rounded-xl bg-leaf-50 p-4"
                      key={supplier.name}
                    >
                      <span className="font-semibold">{supplier.name}</span>
                      <span>
                        {supplier.allocated_quantity_kg} kg · ₹
                        {supplier.price_per_kg}/kg · score {supplier.score}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={confirm}
                  className="mt-6 rounded-xl bg-earth px-4 py-3 font-semibold text-white"
                >
                  Confirm allocation and create orders
                </button>
              </>
            )}
          </section>
        )}
        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        )}
      </div>
    </main>
  );
}
