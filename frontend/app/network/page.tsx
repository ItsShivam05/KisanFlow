import React from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Warehouse,
  ThermometerSnowflake,
  ShieldCheck,
  ArrowRight,
  Layers,
  Radio,
} from "lucide-react";

export default function NetworkPage() {
  const hubs = [
    {
      region: "North Zone - Punjab & Haryana",
      center: "Karnal Agri-Hub",
      commodities: "Basmati Rice, Durum Wheat, Mustard",
      capacity: "25,000 MT Storage",
      status: "Active Operational",
    },
    {
      region: "Central Zone - Madhya Pradesh",
      center: "Indore Grain Complex",
      commodities: "Sharbati Wheat, Soybeans, Gram Pulses",
      capacity: "40,000 MT Silos",
      status: "Active Operational",
    },
    {
      region: "Western Zone - Maharashtra",
      center: "Nashik & Ratnagiri Packhouses",
      commodities: "Alphonso Mangoes, Grade-A Onions, Grapes",
      capacity: "Cold Storage 15,000 MT",
      status: "Active Operational",
    },
    {
      region: "Southern Zone - Andhra & Karnataka",
      center: "Guntur & Kolar Consolidation",
      commodities: "Chilli, Tomatoes, Maize, Turmeric",
      capacity: "20,000 MT Cold Chain",
      status: "Active Operational",
    },
  ];

  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Radio className="w-3.5 h-3.5" />
            Pan-India Physical Infrastructure
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Integrated Agricultural Supply Network
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            KisanFlow combines digital marketplace software with vetted rural aggregation centers, modern packhouses, and cold chain transit routes to eliminate harvest wastage.
          </p>
        </div>

        {/* Infrastructure Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Warehouse className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Village Aggregation Hubs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Located within 15 km of member farm clusters to minimize local transport cost and harvest exposure to heat.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Pre-Cooling & Controlled Atmosphere</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintains exact relative humidity and temperature for perishables like mangoes, onions, and greens to double shelf life.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Direct Transit Delivery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scheduled truckload dispatches directly from aggregation packhouses straight to buyer distribution warehouses.
            </p>
          </div>
        </div>

        {/* Regional Hubs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Regional Supply Clusters</h2>
              <p className="text-xs text-slate-500">Facilities currently feeding produce into the KisanFlow marketplace.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              4 Regional Hubs Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Zone & State</th>
                  <th className="px-6 py-4">Primary Facility</th>
                  <th className="px-6 py-4">Key Produce Handled</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Network Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hubs.map((hub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{hub.region}</td>
                    <td className="px-6 py-4 text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {hub.center}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{hub.commodities}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{hub.capacity}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {hub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action */}
        <div className="text-center pt-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            Explore Produce from These Hubs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
