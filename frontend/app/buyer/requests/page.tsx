"use client";
import React from "react";
import { Clock, CheckCircle2, XCircle, ArrowRight, ClipboardList } from "lucide-react";

const requests = [
  {
    id: "PRQ-2026-001",
    produce: "Wheat (Sharbati)",
    qty: "50 MT",
    priceRange: "₹25,000 – ₹30,000/MT",
    deliveryBy: "Sep 20, 2026",
    location: "Dharavi Warehouse, Mumbai",
    certs: ["FSSAI", "ISO 22000"],
    status: "matched",
    proposals: 3,
    submitted: "Sep 01, 2026",
  },
  {
    id: "PRQ-2026-002",
    produce: "Alphonso Mangoes",
    qty: "20 MT",
    priceRange: "₹80,000 – ₹95,000/MT",
    deliveryBy: "Sep 15, 2026",
    location: "Thane Cold Storage, Mumbai",
    certs: ["Organic", "APEDA"],
    status: "pending",
    proposals: 0,
    submitted: "Sep 05, 2026",
  },
  {
    id: "PRQ-2026-003",
    produce: "Red Onion (Export)",
    qty: "100 MT",
    priceRange: "₹20,000 – ₹25,000/MT",
    deliveryBy: "Sep 30, 2026",
    location: "JNPT Export Hub, Nhava Sheva",
    certs: ["FSSAI", "APEDA"],
    status: "closed",
    proposals: 7,
    submitted: "Aug 28, 2026",
  },
];

const statusMap: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  matched: { label: "Proposals Received", cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending: { label: "Awaiting Match", cls: "bg-amber-100 text-amber-700", icon: <Clock className="w-3.5 h-3.5" /> },
  closed: { label: "Closed", cls: "bg-slate-100 text-slate-500", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function BuyerRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Track all your bulk procurement requests</p>
        </div>
        <a href="/buyer/procurement" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition">
          + New Request
        </a>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Requests", value: requests.length, cls: "text-slate-900" },
          { label: "Pending Match", value: requests.filter((r) => r.status === "pending").length, cls: "text-amber-600" },
          { label: "Proposals Received", value: requests.filter((r) => r.status === "matched").length, cls: "text-emerald-600" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className={`text-2xl font-black ${cls}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-slate-400">{req.id}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusMap[req.status].cls}`}>
                    {statusMap[req.status].icon}
                    {statusMap[req.status].label}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900">{req.produce}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                  <span>Qty: <strong className="text-slate-900">{req.qty}</strong></span>
                  <span>Price: <strong className="text-slate-900">{req.priceRange}</strong></span>
                  <span>Delivery by: <strong className="text-slate-900">{req.deliveryBy}</strong></span>
                </div>
                <p className="text-xs text-slate-400 mt-1">📍 {req.location}</p>
                <div className="flex gap-1.5 mt-2">
                  {req.certs.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{c}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                {req.proposals > 0 && (
                  <p className="text-2xl font-black text-emerald-700">{req.proposals}</p>
                )}
                <p className="text-xs text-slate-400">{req.proposals > 0 ? "proposals" : "submitted"}</p>
                <p className="text-xs text-slate-400 mt-1">{req.submitted}</p>
              </div>
            </div>
            {req.status === "matched" && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-800">
                  View {req.proposals} Supplier Proposals <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
