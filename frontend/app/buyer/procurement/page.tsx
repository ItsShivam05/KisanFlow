"use client";
import React, { useState } from "react";
import { ClipboardList, Plus, Calendar, MapPin, Package } from "lucide-react";

const categories = ["Cereals", "Vegetables", "Fruits", "Spices", "Pulses", "Oilseeds"];

export default function BuyerProcurementPage() {
  const [form, setForm] = useState({
    produce: "",
    category: "",
    quantity: "",
    unit: "MT",
    priceRange: "",
    deliveryDate: "",
    deliveryLocation: "",
    qualitySpecs: "",
    certRequired: [] as string[],
    notes: "",
  });

  const certs = ["FSSAI", "Organic", "APEDA", "ISO 22000", "Spices Board"];

  const toggleCert = (cert: string) => {
    setForm((f) => ({
      ...f,
      certRequired: f.certRequired.includes(cert)
        ? f.certRequired.filter((c) => c !== cert)
        : [...f.certRequired, cert],
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Bulk Procurement Request</h1>
        <p className="text-sm text-slate-500 mt-1">
          Specify your requirements and we&apos;ll match you with verified suppliers
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {/* Produce Details */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            Produce Requirements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Produce Name *</label>
              <input
                type="text"
                placeholder="e.g., Wheat Sharbati"
                value={form.produce}
                onChange={(e) => setForm((f) => ({ ...f, produce: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Quantity Required *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-20 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option>MT</option>
                  <option>KG</option>
                  <option>Qtl</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Target Price Range (per MT)</label>
              <input
                type="text"
                placeholder="e.g., ₹25,000 - ₹30,000"
                value={form.priceRange}
                onChange={(e) => setForm((f) => ({ ...f, priceRange: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            Delivery Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Required By Date *</label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Delivery Location *</label>
              <input
                type="text"
                placeholder="e.g., Dharavi Warehouse, Mumbai"
                value={form.deliveryLocation}
                onChange={(e) => setForm((f) => ({ ...f, deliveryLocation: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        {/* Quality */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4">Quality & Certifications</h2>
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Required Certifications</label>
            <div className="flex flex-wrap gap-2">
              {certs.map((cert) => (
                <button
                  key={cert}
                  onClick={() => toggleCert(cert)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.certRequired.includes(cert)
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Quality Specifications</label>
            <textarea
              rows={3}
              placeholder="Specify moisture %, grade, size, colour, foreign matter tolerance, etc."
              value={form.qualitySpecs}
              onChange={(e) => setForm((f) => ({ ...f, qualitySpecs: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Additional Notes</label>
          <textarea
            rows={2}
            placeholder="Any additional requirements or preferences..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all">
            Submit Procurement Request
          </button>
          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:border-slate-300 transition">
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}
