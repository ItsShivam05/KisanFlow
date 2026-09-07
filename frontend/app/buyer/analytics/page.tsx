"use client";
import React from "react";
import { BarChart3, TrendingUp, TrendingDown, Package, IndianRupee, Truck } from "lucide-react";

const monthlySpend = [
  { month: "Apr", amount: 38 },
  { month: "May", amount: 52 },
  { month: "Jun", amount: 45 },
  { month: "Jul", amount: 61 },
  { month: "Aug", amount: 72 },
  { month: "Sep", amount: 48 },
];
const maxSpend = Math.max(...monthlySpend.map((d) => d.amount));

const categoryBreakdown = [
  { name: "Cereals", pct: 42, color: "bg-amber-500" },
  { name: "Vegetables", pct: 28, color: "bg-emerald-500" },
  { name: "Fruits", pct: 18, color: "bg-blue-500" },
  { name: "Spices", pct: 12, color: "bg-violet-500" },
];

const topSuppliers = [
  { name: "MP Agri Co-op, Bhopal", orders: 4, spend: "₹56L", rating: 4.7 },
  { name: "Nashik FPO", orders: 3, spend: "₹38L", rating: 4.9 },
  { name: "Sangli Farmers Collective", orders: 6, spend: "₹31L", rating: 4.5 },
];

export default function BuyerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Procurement Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">FY 2026-27 · Reliance Retail Ltd. · Q2</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Spend (YTD)", value: "₹3.16Cr", change: "+18%", up: true, icon: IndianRupee },
          { label: "Total Orders", value: "24", change: "+6 vs Q1", up: true, icon: Package },
          { label: "Avg Order Size", value: "₹13.2L", change: "-2% vs Q1", up: false, icon: BarChart3 },
          { label: "Delivery On Time", value: "94%", change: "+3% vs Q1", up: true, icon: Truck },
        ].map(({ label, value, change, up, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 ${up ? "text-emerald-600" : "text-red-500"}`}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-5">Monthly Procurement Spend (Lakhs ₹)</h2>
          <div className="flex items-end gap-3 h-40">
            {monthlySpend.map((d) => {
              const pct = (d.amount / maxSpend) * 100;
              const isCurrent = d.month === "Sep";
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-500">₹{d.amount}L</p>
                  <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                    <div
                      className={`w-full rounded-t-lg transition-all ${isCurrent ? "bg-amber-500" : "bg-amber-200"}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-xs font-semibold ${isCurrent ? "text-amber-700" : "text-slate-400"}`}>{d.month}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-5">Spend by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between mb-1.5">
                  <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                  <p className="text-sm font-bold text-slate-900">{cat.pct}%</p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Top Suppliers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Supplier", "Orders", "Total Spend", "Avg Rating"].map((h) => (
                  <th key={h} className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSuppliers.map((s) => (
                <tr key={s.name} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 text-slate-600">{s.orders}</td>
                  <td className="py-3 font-bold text-slate-900">{s.spend}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      ⭐ {s.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
