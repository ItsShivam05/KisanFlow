import React from "react";
import Link from "next/link";
import {
  Sprout,
  Target,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <Sprout className="w-3.5 h-3.5" />
            Our Mission & Impact
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Restoring Prosperity to India&apos;s Farming Heartlands
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Agriculture is the backbone of India, employing over 45% of the national workforce. Yet farmers often receive less than a fraction of the consumer price. KisanFlow was founded to fix this structural asymmetry.
          </p>
        </div>

        {/* Problem vs Solution Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Legacy Mandi System */}
          <div className="p-8 rounded-3xl bg-red-50/50 border border-red-200/80 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 px-3 py-1 rounded-full">
              Legacy Agricultural Trade
            </div>
            <h3 className="text-xl font-bold text-slate-900">The Problem with Traditional Intermediaries</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>3 to 5 layers of commission brokers taking up to 35% margin.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Manual weight cuts and unfair arbitrary quality deductions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Farmers traveling overnight to mandis without knowing market price.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Payment delays extending up to 60-90 days, trapping farmers in debt.</span>
              </li>
            </ul>
          </div>

          {/* The KisanFlow Model */}
          <div className="p-8 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              The KisanFlow Network
            </div>
            <h3 className="text-xl font-bold text-slate-900">Direct, Digital & Verified Fair Trade</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero commission agents: direct matching between producer and buyer.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Standardized digital grading and calibrated electronic scale weighment.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pre-harvest listing allowing farmers to negotiate prices before cutting crops.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Immediate direct-to-bank settlement backed by verified electronic dispatch.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Fair Price Principles */}
        <div id="principles" className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Our Core Principles</h2>
            <p className="text-slate-500 text-sm">Non-negotiable values guiding every interaction on our platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <Target className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-1">Price Transparency</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Both parties always see true farm-gate realization and logistics breakdown with zero hidden charges.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-1">Quality Assurance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear parameters tested at FPO centers so buyers get exactly what they ordered and farmers get premium pay for quality.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <Award className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-1">Farmer First Growth</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We measure platform success not just by transacted tonnage, but by the measurable income uplift of participating farming families.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            Explore the Live Marketplace
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
