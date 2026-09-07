"use client";
import React, { useState, useEffect } from "react";
import { ShoppingBag, Truck, CheckCircle2, Clock, Search, RefreshCw } from "lucide-react";
import { dataService } from "@/services/dataService";

const DEMO_FARMER_ID = "22222222-2222-2222-2222-222222222201";

const orderStatusMap: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700",
    icon: <Clock className="w-3 h-3" />,
  },
  confirmed: {
    label: "Confirmed",
    cls: "bg-blue-100 text-blue-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    cls: "bg-violet-100 text-violet-700",
    icon: <Truck className="w-3 h-3" />,
  },
  dispatched: {
    label: "Dispatched",
    cls: "bg-violet-100 text-violet-700",
    icon: <Truck className="w-3 h-3" />,
  },
  delivered: {
    label: "Delivered",
    cls: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

const paymentBadge: Record<string, string> = {
  pending: "text-amber-600 font-semibold",
  paid: "text-emerald-600 font-semibold",
  failed: "text-red-500 font-semibold",
  refunded: "text-slate-500 font-semibold",
};

export default function FarmerOrdersPage() {
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const orders = await dataService.getFarmerOrders(DEMO_FARMER_ID);
      setDbOrders(orders);
    } catch (e) {
      console.error("Error loading farmer orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = dbOrders.filter((o) => {
    const matchSearch =
      (o.product_name && o.product_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.id && o.id.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || o.order_status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connected to Neon PostgreSQL Database &bull; Real-time institutional orders
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Sync Orders
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: dbOrders.length, cls: "text-slate-900" },
          { label: "Pending/Confirmed", value: dbOrders.filter((o) => ["pending", "confirmed"].includes(o.order_status)).length, cls: "text-amber-600" },
          { label: "Out for Delivery", value: dbOrders.filter((o) => ["out_for_delivery", "dispatched"].includes(o.order_status)).length, cls: "text-blue-600" },
          { label: "Delivered", value: dbOrders.filter((o) => o.order_status === "delivered").length, cls: "text-emerald-600" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className={`text-2xl font-black ${cls}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders by crop or buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "confirmed", "out_for_delivery", "delivered"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === s
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading orders from database...
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statusConfig = orderStatusMap[order.order_status] || {
              label: order.order_status,
              cls: "bg-slate-100 text-slate-700",
              icon: <Clock className="w-3 h-3" />,
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">
                        {order.id.slice(0, 8)}...
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.cls}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                      <span className={`text-xs ${paymentBadge[order.payment_status] || "text-slate-500"}`}>
                        Payment: {order.payment_status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-base font-bold text-slate-900 mt-1">
                      {order.product_name} &bull; {order.quantity} {order.unit}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Procured by: <span className="font-semibold text-slate-800">{order.buyer_name}</span> &bull; {order.delivery_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">
                      ₹{Number(order.subtotal).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ordered: {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-0">
                    {["Placed", "Confirmed", "Out for Delivery", "Delivered"].map((step, i) => {
                      const stages = ["", "confirmed", "out_for_delivery", "delivered"];
                      const current = stages.indexOf(order.order_status);
                      const done = i <= current;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                                done
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-300 text-slate-300"
                              }`}
                            >
                              {done && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <p className={`text-xs mt-1 font-medium ${done ? "text-emerald-700" : "text-slate-400"}`}>
                              {step}
                            </p>
                          </div>
                          {i < 3 && (
                            <div
                              className={`flex-1 h-0.5 mx-1 mb-4 ${done && i < current ? "bg-emerald-500" : "bg-slate-200"}`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No procurement orders found in database</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
