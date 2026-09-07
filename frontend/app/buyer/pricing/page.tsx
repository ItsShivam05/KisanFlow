"use client";
import React from "react";
import { IndianRupee, TrendingDown, BarChart3, PieChart, Layers } from "lucide-react";

const priceItems = [
  { label: "Base Produce Cost", amount: 14_00_000, pct: 79, color: "#10b981" },
  { label: "Logistics & Cold Chain", amount: 1_80_000, pct: 10.2, color: "#3b82f6" },
  { label: "Quality Inspection Fee", amount: 42_000, pct: 2.4, color: "#8b5cf6" },
  { label: "Platform Service Fee (1.5%)", amount: 21_000, pct: 1.2, color: "#f59e0b" },
  { label: "GST (5%)", amount: 70_000, pct: 4.0, color: "#ef4444" },
  { label: "Packaging & Handling", amount: 56_000, pct: 3.2, color: "#64748b" },
];

const total = priceItems.reduce((s, i) => s + i.amount, 0);

const compareData = [
  { channel: "KisanFlow (Direct)", price: 14_00_000, savings: "₹3,50,000 saved", highlight: true },
  { channel: "Traditional APMC", price: 17_50_000, savings: "", highlight: false },
  { channel: "Private Trader", price: 16_80_000, savings: "", highlight: false },
];

export default function BuyerPricingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Price Breakdown</h1>
        <p className="text-sm text-slate-500 mt-1">Full cost transparency for your procurement</p>
      </div>

      {/* Reference Order */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-900">
          📋 Reference: <strong>B-ORD-001</strong> — Wheat Sharbati (50 MT) · Supplier: MP Agri Co-op
        </p>
      </div>

      {/* Cost Items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          Cost Components
        </h2>
        <div className="space-y-4">
          {priceItems.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">₹{item.amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-slate-400">{item.pct}%</p>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <p className="text-base font-black text-slate-900">Total Order Value</p>
            <p className="text-2xl font-black text-slate-900">₹{total.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Channel Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-600" />
          Channel Cost Comparison
        </h2>
        <div className="space-y-3">
          {compareData.map((c) => {
            const pct = (c.price / compareData[1].price) * 100;
            return (
              <div key={c.channel} className={`p-4 rounded-xl border ${c.highlight ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{c.channel}</p>
                    {c.highlight && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Best Value</span>}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">₹{c.price.toLocaleString("en-IN")}</p>
                    {c.savings && <p className="text-xs text-emerald-600 font-bold">{c.savings}</p>}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className={`h-full rounded-full ${c.highlight ? "bg-amber-500" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            By procuring through KisanFlow, you save <strong>~20%</strong> vs traditional APMC channels on this order.
          </p>
        </div>
      </div>
    </div>
  );
}
