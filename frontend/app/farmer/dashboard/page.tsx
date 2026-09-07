"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sprout,
  ShoppingBag,
  Warehouse,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCw,
} from "lucide-react";
import { dataService } from "@/services/dataService";
import { FarmerDashboardData } from "@/types/product";

// Default seeded farmer ID
const DEMO_FARMER_ID = "22222222-2222-2222-2222-222222222201";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    out_for_delivery: "bg-blue-100 text-blue-700",
    dispatched: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    delivered: "bg-slate-100 text-slate-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
};

export default function FarmerDashboard() {
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dataService.getFarmerDashboard(DEMO_FARMER_ID);
      setData(res);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Could not fetch farmer metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statsCards = [
    {
      label: "Total Harvest Lots",
      value: data?.metrics?.totalLots ?? "2",
      unit: "lots",
      icon: Sprout,
      color: "emerald",
      change: "Active in godowns",
      positive: true,
    },
    {
      label: "Pending Orders",
      value: data?.metrics?.pendingOrders ?? "1",
      unit: "orders",
      icon: ShoppingBag,
      color: "blue",
      change: "Ready for dispatch",
      positive: true,
    },
    {
      label: "Gross Realization",
      value: data?.metrics?.totalEarnings
        ? `₹${Number(data.metrics.totalEarnings).toLocaleString("en-IN")}`
        : "₹1,92,500",
      unit: "",
      icon: IndianRupee,
      color: "amber",
      change: "Direct settlement",
      positive: true,
    },
    {
      label: "Available Stock",
      value: data?.metrics?.totalAvailableQty ?? "580",
      unit: "units",
      icon: Warehouse,
      color: "violet",
      change: "Live across lots",
      positive: true,
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {data?.farmer?.farm_name || "Patel Organic Farms"} 🌾
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {data?.farmer?.verification_status || "Verified"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Owner: {data?.farmer?.full_name || "Ramesh Patel"} &bull; {data?.farmer?.address || "Indore, MP"}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Sync Live DB
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>Backend sync notice: {error} (Displaying seeded fallback)</span>
          <button onClick={fetchDashboard} className="font-bold underline ml-2">Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, unit, icon: Icon, color, change, positive }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {value}
              {unit && <span className="text-sm font-medium text-slate-400 ml-1">{unit}</span>}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            <p className={`text-xs mt-2 font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
              {change}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/farmer/produce"
          className="flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <Sprout className="w-5 h-5" />
            <span className="font-semibold text-sm">List New Produce</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/farmer/inventory"
          className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <Warehouse className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-sm">Update Inventory</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/farmer/orders"
          className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">View All Orders</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Orders from Live Database */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Recent Buyer Procurement Orders</h2>
          <Link
            href="/farmer/orders"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {(data?.recentOrders && data.recentOrders.length > 0) ? (
            data.recentOrders.map((order) => (
              <div
                key={order.order_id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {order.product_name}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(order.order_status)}`}
                    >
                      {order.order_status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {order.buyer_business} &bull; {order.quantity} {order.unit} &bull; {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">
                    ₹{Number(order.subtotal).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{order.order_id.slice(0, 8)}...</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No orders found for this farm profile in database.
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Quality Certificate Ready</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Organic Certification renewed for Malwa & Sanwer agricultural plots.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Direct DBT Settlement Active</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Direct transfer enabled for your linked Bank Account ending in 4102.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
