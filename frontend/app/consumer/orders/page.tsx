"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Truck, CheckCircle2, Clock, Package, RefreshCw } from "lucide-react";
import { dataService } from "@/services/dataService";
import { Order } from "@/types/product";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", cls: "bg-amber-100 text-amber-700" },
  out_for_delivery: { label: "Out for Delivery", cls: "bg-blue-100 text-blue-700" },
  delivered: { label: "Delivered", cls: "bg-emerald-100 text-emerald-700" },
};

const steps = ["Placed", "Packed", "Dispatched", "Delivered"];
const stepForStatus: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  out_for_delivery: 2,
  delivered: 3,
};

export default function ConsumerOrdersPage() {
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const orders = await dataService.getOrders();
      setDbOrders(orders);
    } catch (e) {
      console.error("Error loading consumer orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders & Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Live order dispatch & delivery status from database</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Sync
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Connecting to database & loading orders...
        </div>
      ) : (
        <div className="space-y-4">
          {dbOrders.map((order) => {
            const currentStep = stepForStatus[order.order_status] ?? 0;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <p className="font-mono text-xs text-slate-400">Order ID: {order.id.slice(0, 8)}...</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {order.buyer_name || "Procurement Order"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {order.delivery_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-slate-900">
                      ₹{Number(order.total_amount).toLocaleString("en-IN")}
                    </p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusMap[order.order_status]?.cls || "bg-slate-100 text-slate-600"}`}>
                      {statusMap[order.order_status]?.label || order.order_status}
                    </span>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="flex items-center gap-0 mt-3 pt-3 border-t border-slate-100">
                  {steps.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            i <= currentStep
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-300 text-slate-300"
                          }`}
                        >
                          {i <= currentStep && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${i <= currentStep ? "text-emerald-700" : "text-slate-400"}`}>
                          {step}
                        </p>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentStep ? "bg-emerald-500" : "bg-slate-200"}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400 self-center">
                    Payment Status: <b className="text-emerald-700 uppercase">{order.payment_status}</b>
                  </span>
                </div>
              </div>
            );
          })}
          {dbOrders.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No orders found in database.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
