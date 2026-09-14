"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

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

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    product_id: products[0].id,
    total_quantity_kg: "",
    asking_price_per_kg: "",
    quality_grade: "A",
    harvest_date: new Date().toISOString().slice(0, 10),
    region: "Patna",
  });
  async function load() {
    try {
      setItems(await apiRequest<InventoryItem[]>("/inventory"));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load inventory",
      );
    }
  }
  useEffect(() => {
    if (!localStorage.getItem("kisanflow_token")) router.replace("/login");
    else void load();
  }, [router]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/inventory", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage("Produce listed successfully.");
      setForm({ ...form, total_quantity_kg: "", asking_price_per_kg: "" });
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to list produce",
      );
    }
  }
  return (
    <main className="min-h-screen bg-cream px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <a className="font-bold text-leaf-900" href="/dashboard">
          ← Dashboard
        </a>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section>
            <p className="eyebrow">Farmer workspace</p>
            <h1 className="mt-2 text-4xl font-semibold text-leaf-900">
              My produce
            </h1>
            <p className="mt-3 text-stone-600">
              List available harvest so buyers and the matching engine can find
              it.
            </p>
            <form
              onSubmit={submit}
              className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-soft"
            >
              <select
                className="field"
                value={form.product_id}
                onChange={(e) =>
                  setForm({ ...form, product_id: e.target.value })
                }
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
                placeholder="Quantity (kg)"
                value={form.total_quantity_kg}
                onChange={(e) =>
                  setForm({ ...form, total_quantity_kg: e.target.value })
                }
              />
              <input
                className="field"
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="Asking price per kg (INR)"
                value={form.asking_price_per_kg}
                onChange={(e) =>
                  setForm({ ...form, asking_price_per_kg: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="field"
                  value={form.quality_grade}
                  onChange={(e) =>
                    setForm({ ...form, quality_grade: e.target.value })
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
                  value={form.harvest_date}
                  onChange={(e) =>
                    setForm({ ...form, harvest_date: e.target.value })
                  }
                />
              </div>
              <button className="w-full rounded-xl bg-leaf-700 px-4 py-3 font-semibold text-white">
                List produce
              </button>
              {message && <p className="text-sm text-leaf-700">{message}</p>}
              {error && <p className="text-sm text-red-700">{error}</p>}
            </form>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-stone-900">
              Available lots
            </h2>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-6 text-stone-500">
                  No available produce yet.
                </p>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-white p-5 shadow-soft"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-stone-900">
                          {item.product_name}
                        </h3>
                        <p className="mt-1 text-sm text-stone-500">
                          Harvested {item.harvest_date} · Grade{" "}
                          {item.quality_grade}
                        </p>
                      </div>
                      <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-semibold text-leaf-700">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-stone-500">Available</p>
                        <p className="font-semibold">
                          {item.available_quantity_kg} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-stone-500">Listed</p>
                        <p className="font-semibold">
                          {item.total_quantity_kg} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-stone-500">Price</p>
                        <p className="font-semibold">
                          ₹{item.asking_price_per_kg}/kg
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
