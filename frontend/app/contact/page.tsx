"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "Farmer / FPO",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitted(true);
  };

  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <HelpCircle className="w-3.5 h-3.5" />
            Support & Regional Offices
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Connect with the KisanFlow Team
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Whether you are a farmer wanting to list your harvest, an FPO seeking bulk buyers, or an institutional buyer setting up a supply contract, we are here to support you.
          </p>
        </div>

        {/* Contact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Info Side */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <h3 className="text-lg font-bold text-slate-900">National Kisan Helpline</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Free advisory and enrollment support for Indian farmers in Hindi, English, Punjabi, and Marathi.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Toll-Free Support</span>
                    <span className="text-sm font-bold text-slate-900">1800-KISAN-FLOW (1800-547-263)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Direct Email</span>
                    <span className="text-sm font-bold text-slate-900">contact@kisanflow.in</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Operating Hours</span>
                    <span className="text-sm font-bold text-slate-900">Mon - Sat: 7:00 AM - 8:00 PM IST</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Regional Agritech Centers
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>HQ:</strong> Krishi Innovation Center, Pusa Campus, New Delhi 110012
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Western Hub:</strong> APMC Yard Complex, Market Yard, Pune 411037
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Central Hub:</strong> Agri-Logistics Park, Sanwer Road, Indore 452015
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
            <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-xs">
              {submitted ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto">
                    Thank you, {formData.name}. Our regional coordinator will contact you at {formData.phone} shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", phone: "", role: "Farmer / FPO", message: "" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Send an Inquiry or Schedule Onboarding</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Fill in your details and our team will get in touch within 24 hours.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      I am registering as:
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 cursor-pointer"
                    >
                      <option value="Farmer / FPO">Individual Farmer / FPO Representative</option>
                      <option value="Institutional Buyer">Food Processor / FMCG Buyer</option>
                      <option value="Retail Chain">Supermarket / Retail Chain</option>
                      <option value="Logistics Partner">Transport / Cold-Chain Fleet Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Commodities or Requirements
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Specify your crop, estimated tonnage, or procurement timeline..."
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
