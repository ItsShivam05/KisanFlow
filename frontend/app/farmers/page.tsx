import React from "react";
import Link from "next/link";
import {
  Sprout,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  IndianRupee,
  PackageCheck,
  Scale,
} from "lucide-react";

export default function FarmersPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <Sprout className="w-3.5 h-3.5" />
            Farmer & FPO Empowerment Portal
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Sell Direct. Get Fair Prices. No Middlemen.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            KisanFlow provides Indian farmers and Farmer Producer Organizations (FPOs) with direct access to institutional buyers, bulk procurement contracts, and transparent price realization.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Browse Active Marketplace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4 Pillars for Farmers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">15-25% Higher Earnings</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              By removing up to 4 layers of arthiyas (commission agents) and intermediaries, the margin returns directly to the farmer.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Farm-Gate Pickup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No need to spend entire nights at mandi gates or pay unorganized loading charges. Produce is picked up directly from your village hub.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Accurate Digital Weighing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent digital scale weighment with automated printed and SMS receipts. Say goodbye to fraudulent weight deductions.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Direct Bank Settlement</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant digital transfers directly to DBT bank accounts upon quality acceptance, eliminating 3-month credit risks.
            </p>
          </div>
        </div>

        {/* FPO Aggregation Advantage */}
        <div className="p-8 sm:p-12 bg-gradient-to-br from-emerald-900 to-slate-950 text-white rounded-3xl shadow-xl">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              For FPOs & Cooperatives
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Aggregate Member Harvests and Negotiate Bulk Institutional Contracts
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              KisanFlow is built specifically to support FPO digital transformation. Manage multiple farmer profiles under your FPO, pool crop supply into commercial truckloads, and fulfill large purchase orders from national retail chains.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bulk inventory cataloging by quality grade</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Batch-level traceability to individual farms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated logistics scheduling from FPO godown</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GST & e-Way bill digital compliance ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
