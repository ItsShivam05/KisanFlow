import React from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Layers,
} from "lucide-react";

export default function BuyersPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Building2 className="w-3.5 h-3.5" />
            Institutional Procurement & B2B Supply
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Reliable Farm-Direct Sourcing with Assured Quality & Specs
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            KisanFlow serves food processing FMCG companies, modern trade grocery chains, restaurant chains, and exporters requiring standardized commodities in bulk truckloads.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Browse Available Produce
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3 Value Pillars for Buyers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quality Grade Specifications</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every listing details physical parameters including moisture levels, grain count, foreign matter %, and organic/chemical certifications before dispatch.
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">End-to-End Cold Chain</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              From farm-gate pre-cooling to reefer truck logistics, KisanFlow maintains unbroken temperature monitoring to guarantee freshness upon arrival.
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Full Batch Traceability</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Trace individual consignments back to certified FPO cluster centers and farms for full food safety compliance and ESG reporting.
            </p>
          </div>
        </div>

        {/* Buyer Sectors */}
        <div className="bg-slate-100/70 p-8 sm:p-12 rounded-3xl border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Industries Powered by KisanFlow
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">FMCG & Food Processors</h4>
              <p className="text-xs text-slate-500">Wheat flours, edible oils, tomato paste, pulses, and snacks manufacturers.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Modern Retail & Quick-Commerce</h4>
              <p className="text-xs text-slate-500">Supermarket chains, e-grocers, and dark store networks requiring daily fresh replenishment.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">HORECA Sector</h4>
              <p className="text-xs text-slate-500">Hotel chains, cloud kitchens, and institutional caterers needing predictable bulk contracts.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Exporters & Trading Houses</h4>
              <p className="text-xs text-slate-500">APEDA registered export firms sourcing GI-tagged and export-grade basmati, spices, and fruits.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
