"use client";
import React, { useState } from "react";
import { User, MapPin, Phone, Mail, Edit2, Save, Plus, Trash2 } from "lucide-react";

export default function ConsumerProfilePage() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "Priya Sharma",
    phone: "+91 99887 76655",
    email: "priya.sharma@gmail.com",
  });

  const addresses = [
    {
      id: 1,
      label: "Home",
      address: "Flat 4B, Sunshine Apartments, Bandra West, Mumbai - 400050",
      default: true,
    },
    {
      id: 2,
      label: "Office",
      address: "301, Maker Chambers, Nariman Point, Mumbai - 400021",
      default: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account and delivery addresses</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            editing
              ? "bg-emerald-600 text-white"
              : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
        </button>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-2xl font-black">P</div>
        <div>
          <p className="text-lg font-bold text-slate-900">{form.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">KisanFlow Consumer · Member since Sep 2026</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Active</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Gold Member</span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Full Name", field: "name", icon: User },
            { label: "Mobile Number", field: "phone", icon: Phone },
            { label: "Email Address", field: "email", icon: Mail },
          ].map(({ label, field, icon: Icon }) => (
            <div key={field}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={form[field as keyof typeof form]}
                  disabled={!editing}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none disabled:cursor-default"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Delivery Addresses</h2>
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800">
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`flex items-start justify-between p-4 rounded-xl border ${addr.default ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${addr.default ? "text-emerald-600" : "text-slate-400"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{addr.label}</p>
                    {addr.default && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Default</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{addr.address}</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-red-500 transition shrink-0 ml-3">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orders", value: "8" },
          { label: "Reviews Given", value: "5" },
          { label: "Points Earned", value: "240" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
