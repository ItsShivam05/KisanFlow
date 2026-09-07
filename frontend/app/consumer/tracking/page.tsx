"use client";
import React from "react";
import { MapPin, Truck, Clock, Phone, CheckCircle2 } from "lucide-react";

export default function ConsumerTrackingPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">Track your active delivery in real-time</p>
      </div>

      {/* Active Delivery Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-200 mb-1">ORDER CONS-ORD-001</p>
            <p className="text-lg font-bold">Alphonso Mangoes + Turmeric</p>
            <p className="text-sm text-emerald-200 mt-1 flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              Out for Delivery — ETA 30 mins
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">30</p>
            <p className="text-xs text-emerald-200">min ETA</p>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-56 bg-gradient-to-br from-emerald-50 via-slate-100 to-blue-50 flex flex-col items-center justify-center gap-3 relative">
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjAiIHkxPSIyMCIgeDI9IjQwIiB5Mj0iMjAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMjAiIHkxPSIwIiB4Mj0iMjAiIHkyPSI0MCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')]" />
          <MapPin className="w-10 h-10 text-emerald-600 drop-shadow-lg" />
          <p className="text-sm font-semibold text-slate-600">Live Map — Delivery Partner en route</p>
          <p className="text-xs text-slate-400">Bandra West, Mumbai</p>
        </div>
        <div className="p-5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Vijay Patil (Delivery Partner)</p>
              <p className="text-xs text-slate-500 mt-0.5">Vehicle: KA-05-AB-1234 · Reefer Van</p>
            </div>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-base font-bold text-slate-900 mb-4">Delivery Timeline</h2>
        <div className="space-y-4">
          {[
            { time: "10:30 AM", event: "Order placed", done: true },
            { time: "11:15 AM", event: "Produce picked from Ravi Kumar Farm, Nashik", done: true },
            { time: "01:45 PM", event: "Reached KisanFlow Mumbai distribution hub", done: true },
            { time: "03:20 PM", event: "Out for delivery — Vijay Patil assigned", done: true },
            { time: "~04:00 PM", event: "Expected delivery to your address", done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-emerald-600 text-white" : "bg-slate-200"}`}>
                {step.done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 text-slate-400" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${step.done ? "text-slate-900" : "text-slate-400"}`}>{step.event}</p>
                <p className="text-xs text-slate-400 mt-0.5">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
