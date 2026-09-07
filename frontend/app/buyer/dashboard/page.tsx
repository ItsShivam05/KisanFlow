"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  IndianRupee,
  Truck,
  ClipboardList,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { dataService } from "@/services/dataService";
import { Order } from "@/types/product";

// Seeded buyer IDs from seed.js
const BUYER_IDS = [
  "44444444-4444-4444-4444-444444444401", // Reliance Retail
  "44444444-4444-4444-4444-444444444402", // ITC Agri-Business
  "44444444-4444-4444-4444-444444444403", // BigBasket
];

const statusMap: Record<string, string> = {
  dispatched: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  delivered: "bg-slate-100 text-slate-600",
  processing: "bg-violet-100 text-violet-700",
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

export default function BuyerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const allOrders = await dataService.getOrders();
      setOrders(allOrders || []);
    } catch (e) {
      console.error("Failed to load buyer dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeOrders = orders.filter((o) => o.order_status !== "delivered" && o.order_status !== "cancelled");
  const deliveredOrders = orders.filter((o) => o.order_status === "delivered");
  const totalSpend = orders.reduce((s, o) => s + parseFloat(String(o.total_amount || 0)), 0);
  const pendingOrders = orders.filter((o) => o.order_status === "pending");

  const kpis = [
    { label: "Active Orders", value: loading ? "..." : String(activeOrders.length), sub: `${orders.length} total`, icon: ShoppingBag, color: "blue" },
    { label: "Total Spend", value: loading ? "..." : `₹${(totalSpend / 100000).toFixed(1)}L`, sub: "From live DB", icon: IndianRupee, color: "amber" },
    { label: "Pending Orders", value: loading ? "..." : String(pendingOrders.length), sub: "Awaiting dispatch", icon: ClipboardList, color: "violet" },
    { label: "Delivered", value: loading ? "..." : String(deliveredOrders.length), sub: "Fulfilled orders", icon: Truck, color: "emerald" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">B2B Procurement Dashboard 🏢</h1>
          <p className="text-sm text-slate-500 mt-1">Live data from Neon PostgreSQL · KisanFlow FY 2026-27</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-600" : ""}`} />
          Sync
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            <p className="text-xs mt-1 text-emerald-600 font-semibold">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/buyer/procurement" className="flex items-center justify-between p-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all group">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5" />
            <span className="font-semibold text-sm">Create Procurement Request</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/buyer/marketplace" className="flex items-center justify-between p-4 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all group">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">Browse Available Produce</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/buyer/analytics" className="flex items-center justify-between p-4 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all group">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-sm">View Spend Analytics</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Live Orders from DB */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Live Procurement Orders</h2>
          <span className="text-xs text-slate-400 font-mono">From PostgreSQL</span>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">Loading procurement orders from DB...</div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">
              <p className="text-3xl mb-2">📋</p>
              No orders in the database yet.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm truncate">Order #{(order.id as string).slice(0, 8).toUpperCase()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusMap[order.order_status] || "bg-slate-100 text-slate-600"}`}>
                      {order.order_status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{order.delivery_address}</p>
                </div>
                <p className="font-black text-slate-900 shrink-0 text-sm">
                  ₹{parseFloat(String(order.total_amount || 0)).toLocaleString("en-IN")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Contract Renewal Due</p>
            <p className="text-xs text-amber-700 mt-0.5">Quarterly supply contract with Nashik FPO expires on Sep 30, 2026.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Quality Approved</p>
            <p className="text-xs text-emerald-700 mt-0.5">Wheat batch passed all quality checks. Dispatch authorized by Malwa FPO.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
