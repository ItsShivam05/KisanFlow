"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

type Order = {
  id: string;
  status: string;
  total_amount: string;
  delivery_status: string;
  expected_delivery: string;
};

const DELIVERY_STEPS = ["PICKUP_PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const;
type DeliveryStep = typeof DELIVERY_STEPS[number];

const stepLabel: Record<DeliveryStep, string> = {
  PICKUP_PENDING: "Pickup pending",
  PICKED_UP:      "Picked up",
  IN_TRANSIT:     "In transit",
  DELIVERED:      "Delivered",
};

const ACTION_STATUSES = ["PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PICKUP_PENDING: "badge-amber",
    PICKED_UP:      "badge-blue",
    IN_TRANSIT:     "badge-blue",
    DELIVERED:      "badge-green",
  };
  return map[status] || "badge-stone";
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try {
      setOrders(await apiRequest<Order[]>("/orders"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("kisanflow_token")) { router.replace("/login"); return; }
    void load();
  }, [router]);

  async function update(id: string, status: string) {
    setUpdating(id + status);
    setError("");
    try {
      await apiRequest(`/orders/${id}/delivery`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update delivery status.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AppShell backHref="/dashboard" backLabel="Dashboard">
      <div className="mt-6">
        <p className="eyebrow">Your orders</p>
        <h1 className="page-title">Orders & delivery</h1>
        <p className="mt-2 text-stone-500">Track and manage your active orders below.</p>
      </div>

      {error && (
        <div className="mt-5 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {loading ? (
          /* Skeleton */
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-6 w-24" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="font-medium text-stone-900">No active orders yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Orders from confirmed procurement requests will appear here.
            </p>
            <a href="/inventory" className="mt-5 inline-block btn-primary text-sm">
              Browse supply
            </a>
          </div>
        ) : (
          orders.map((order) => {
            const currentIdx = DELIVERY_STEPS.indexOf(order.delivery_status as DeliveryStep);
            return (
              <article key={order.id} className="card p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Order #{order.id.slice(0, 8)}</p>
                    <p className="mt-1.5 text-2xl font-semibold tabular-nums text-stone-900">
                      ₹{Number(order.total_amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className={statusBadge(order.delivery_status)}>
                    {stepLabel[order.delivery_status as DeliveryStep] || order.delivery_status}
                  </span>
                </div>

                {/* Timeline */}
                <div className="mt-6 flex items-center gap-0">
                  {DELIVERY_STEPS.map((step, idx) => {
                    const done    = idx < currentIdx;
                    const current = idx === currentIdx;
                    const last    = idx === DELIVERY_STEPS.length - 1;
                    return (
                      <div key={step} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                              done
                                ? "border-leaf-600 bg-leaf-600 text-white"
                                : current
                                ? "border-leaf-600 bg-white text-leaf-600"
                                : "border-stone-200 bg-white text-stone-300"
                            }`}
                          >
                            {done ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3">
                                <path fillRule="evenodd" d="M10.072 2.89a.75.75 0 0 1 .038 1.06l-5 5.25a.75.75 0 0 1-1.076.023L1.534 6.724a.75.75 0 1 1 1.06-1.06l1.98 1.98 4.44-4.716a.75.75 0 0 1 1.058-.038Z" clipRule="evenodd" />
                              </svg>
                            ) : current ? (
                              <div className="h-2 w-2 rounded-full bg-leaf-600" />
                            ) : null}
                          </div>
                          <p className={`mt-1.5 text-center text-[10px] leading-tight w-16 ${current ? "font-semibold text-leaf-700" : done ? "text-stone-500" : "text-stone-400"}`}>
                            {stepLabel[step]}
                          </p>
                        </div>
                        {!last && (
                          <div className={`mb-5 h-0.5 flex-1 ${done ? "bg-leaf-500" : "bg-stone-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                  {ACTION_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => update(order.id, status)}
                      disabled={!!updating || order.delivery_status === status}
                      className={`btn-secondary text-xs py-1.5 px-3 ${order.delivery_status === status ? "opacity-40" : ""}`}
                    >
                      {updating === order.id + status ? "Updating…" : `Mark ${stepLabel[status].toLowerCase()}`}
                    </button>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
