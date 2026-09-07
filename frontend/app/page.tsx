import React from "react";
import Link from "next/link";
import {
  Sprout,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Truck,
  Users,
  Building2,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 text-white py-20 lg:py-28">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-800/60 text-emerald-300 border border-emerald-700/60 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>India&apos;s Next-Gen Agricultural Supply-Chain Network</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15]">
              Direct Farm-Gate Procurement,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">
                Zero Exploitative Middlemen.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              KisanFlow bridges Indian farmers and FPOs directly with institutional buyers, food processors, and retailers with transparent pricing and verified quality.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/marketplace"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                Browse Produce Directory & Buy
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/farmer/produce"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white text-sm font-semibold border border-emerald-500/40 backdrop-blur-sm transition-all"
              >
                + Farmer Add Item
              </Link>
            </div>

            {/* 3 Dedicated Portal Launchers */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <Link
                href="/farmer/dashboard"
                className="p-4 bg-emerald-800/40 hover:bg-emerald-800/70 border border-emerald-600/40 rounded-2xl transition-all group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🚜</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-bold text-base text-white">Farmer Portal</h3>
                <p className="text-xs text-emerald-200 mt-1">List produce, manage inventory lots, view bids, track bank DBT payments.</p>
                <span className="mt-3 inline-block text-[11px] font-bold text-emerald-300 underline">Enter Farmer Dashboard &rarr;</span>
              </Link>

              <Link
                href="/buyer/dashboard"
                className="p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-2xl transition-all group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏢</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-bold text-base text-white">Bulk Buyer Portal</h3>
                <p className="text-xs text-slate-300 mt-1">Institutional procurement, truckload tenders, pricing analytics & supplier matching.</p>
                <span className="mt-3 inline-block text-[11px] font-bold text-amber-300 underline">Enter Buyer Portal &rarr;</span>
              </Link>

              <Link
                href="/consumer/home"
                className="p-4 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/40 rounded-2xl transition-all group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🛒</span>
                  <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-bold text-base text-white">Consumer Portal</h3>
                <p className="text-xs text-blue-200 mt-1">Direct fresh harvest delivery, cart, order tracking from farm to doorstep.</p>
                <span className="mt-3 inline-block text-[11px] font-bold text-blue-300 underline">Enter Consumer Portal &rarr;</span>
              </Link>
            </div>

            {/* Live Metrics Strip */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-emerald-800/40 text-left">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</span>
                <span className="text-xs text-slate-400">Direct From Farm-Gate</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">0%</span>
                <span className="text-xs text-slate-400">Hidden Commission</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">Live</span>
                <span className="text-xs text-slate-400">PostgreSQL Catalog</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">Pan-India</span>
                <span className="text-xs text-slate-400">FPO Aggregation Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Why KisanFlow
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              A Transparent Solution to Fragmented Agricultural Trade
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Traditional Mandi systems suffer from multiple middlemen taking 25-40% margins while farmers face delayed payments. KisanFlow transforms this with a digital network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Empowering Farmers & FPOs</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                List harvests in advance, access bulk demand from verified buyers, and get fair digital payments directly into bank accounts.
              </p>
              <Link href="/farmers" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
                Learn how farmers benefit <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Assured Institutional Sourcing</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Food processing companies, modern trade retail, and exporters can procure consistent quality produce with batch traceability and clear specs.
              </p>
              <Link href="/buyers" className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1">
                Institutional procurement <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Integrated Cold-Chain & Logistics</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Farm-gate collection hubs, pre-cooling, and transit monitoring minimize post-harvest wastage and preserve maximum nutrient value.
              </p>
              <Link href="/network" className="text-xs font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
                View supply network <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
              4-Step Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              How KisanFlow Connects the Chain
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                Step 1
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Harvest Listing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Farmers & FPOs register upcoming crop volume, expected harvest date, and produce specifications in the catalog.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                Step 2
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Quality Grading</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Produce is graded at local FPO collection hubs for moisture, purity, grain size, and FSSAI standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                Step 3
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Buyer Matching</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bulk buyers view verified inventory in the live marketplace and initiate direct contracts at fair spot rates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                Step 4
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Direct Dispatch</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Logistics pick up from regional aggregation centers and deliver to destination with instant settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Call to Action */}
      <section className="py-16 bg-emerald-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to explore verified agricultural commodities?
          </h2>
          <p className="text-emerald-100 text-base max-w-xl mx-auto">
            Discover real products fetched directly from our Neon PostgreSQL database.
          </p>
          <div className="pt-2">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-900 text-sm font-bold shadow-lg hover:bg-emerald-50 transition-all hover:scale-105"
            >
              Open Marketplace Catalog
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
