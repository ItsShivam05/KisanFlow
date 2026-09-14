"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Order = {
  id: string;
  status: string;
  total_amount: string;
  delivery_status: string;
  expected_delivery: string;
};
const statuses = ["PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  async function load() {
    try {
      setOrders(await apiRequest<Order[]>("/orders"));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load orders",
      );
    }
  }
  useEffect(() => {
    if (!localStorage.getItem("kisanflow_token")) router.replace("/login");
    else void load();
  }, [router]);
  async function update(id: string, status: string) {
    try {
      await apiRequest(`/orders/${id}/delivery`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update delivery",
      );
    }
  }
  return (
    <main className="min-h-screen bg-cream px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <a className="font-bold text-leaf-900" href="/dashboard">
          ← Dashboard
        </a>
        <h1 className="mt-8 text-4xl font-semibold text-leaf-900">
          Orders and delivery
        </h1>
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-8 text-stone-500">
              No confirmed orders yet.
            </p>
          ) : (
            orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl bg-white p-6 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">
                      Order {order.id.slice(0, 8)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      ₹{order.total_amount}
                    </h2>
                  </div>
                  <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-semibold text-leaf-700">
                    {order.delivery_status}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
                  {["PICKUP_PENDING", ...statuses].map((status) => (
                    <div
                      key={status}
                      className={
                        status === order.delivery_status
                          ? "rounded-lg bg-leaf-700 p-2 text-white"
                          : "rounded-lg bg-stone-100 p-2 text-stone-500"
                      }
                    >
                      {status.replace("_", " ")}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => update(order.id, status)}
                      className="rounded-lg border border-leaf-700 px-3 py-2 text-sm font-semibold text-leaf-700"
                    >
                      Mark {status.replace("_", " ").toLowerCase()}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        )}
      </div>
    </main>
  );
}
