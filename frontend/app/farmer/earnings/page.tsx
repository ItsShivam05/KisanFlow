"use client";
import React, { useState } from "react";
import { IndianRupee, TrendingUp, Download, Calendar, ArrowUpRight } from "lucide-react";

const transactions = [
  {
    id: "TXN-001",
    date: "Sep 07, 2026",
    orderId: "ORD-2026-002",
    produce: "Wheat Sharbati (5 MT)",
    buyer: "BigBasket Pvt. Ltd.",
    amount: 140000,
    type: "credit",
    status: "completed",
  },
  {
    id: "TXN-002",
    date: "Sep 01, 2026",
    orderId: "ORD-2026-001",
    produce: "Alphonso Mangoes (advance)",
    buyer: "Reliance Retail Ltd.",
    amount: 54000,
    type: "credit",
    status: "completed",
  },
  {
    id: "TXN-003",
    date: "Aug 30, 2026",
    orderId: "ORD-2026-003",
    produce: "Red Onion (3 MT)",
    buyer: "Metro Cash & Carry",
    amount: 66000,
    type: "credit",
    status: "completed",
  },
  {
    id: "TXN-004",
    date: "Aug 22, 2026",
    orderId: "MISC",
    produce: "Platform Service Fee",
    buyer: "KisanFlow",
    amount: 2100,
    type: "debit",
    status: "completed",
  },
];

const monthlyData = [
  { month: "Apr", amount: 22000 },
  { month: "May", amount: 35000 },
  { month: "Jun", amount: 28000 },
  { month: "Jul", amount: 41000 },
  { month: "Aug", amount: 56000 },
  { month: "Sep", amount: 42500 },
];

const maxVal = Math.max(...monthlyData.map((d) => d.amount));

export default function FarmerEarningsPage() {
  const totalEarned = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const totalDeducted = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
          <p className="text-sm text-slate-500 mt-1">Track your income and payment history</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-slate-300 transition">
          <Download className="w-4 h-4" />
          Download Statement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
            Total Earned (FY 2026-27)
          </p>
          <p className="text-3xl font-black">
            ₹{(totalEarned / 1000).toFixed(0)}K
          </p>
          <p className="text-emerald-300 text-xs mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +24% vs last season
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            This Month
          </p>
          <p className="text-3xl font-black text-slate-900">₹42,500</p>
          <p className="text-emerald-600 text-xs mt-2">+18% vs last month</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Pending Payment
          </p>
          <p className="text-3xl font-black text-amber-600">₹1,26,000</p>
          <p className="text-slate-400 text-xs mt-2">ORD-2026-001 balance</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-900">Monthly Earnings</h2>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            Apr – Sep 2026
          </div>
        </div>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map((d) => {
            const pct = (d.amount / maxVal) * 100;
            const isCurrent = d.month === "Sep";
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs text-slate-500">
                  ₹{(d.amount / 1000).toFixed(0)}K
                </p>
                <div className="w-full rounded-t-lg transition-all duration-500 relative group" style={{ height: `${pct}%` }}>
                  <div
                    className={`w-full h-full rounded-t-lg ${isCurrent ? "bg-emerald-500" : "bg-emerald-200"}`}
                  />
                </div>
                <p className={`text-xs font-semibold ${isCurrent ? "text-emerald-700" : "text-slate-400"}`}>
                  {d.month}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  txn.type === "credit" ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <IndianRupee
                  className={`w-4 h-4 ${txn.type === "credit" ? "text-emerald-600" : "text-red-500"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{txn.produce}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {txn.buyer} · {txn.date} · {txn.id}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-base font-bold ${
                    txn.type === "credit" ? "text-emerald-700" : "text-red-500"
                  }`}
                >
                  {txn.type === "credit" ? "+" : "-"}₹
                  {txn.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-400 capitalize">{txn.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
