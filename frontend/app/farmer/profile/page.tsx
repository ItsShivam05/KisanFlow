"use client";
import React, { useState } from "react";
import { User, Camera, MapPin, Phone, Mail, Landmark, Edit2, Save } from "lucide-react";

export default function FarmerProfilePage() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "Ravi Kumar",
    phone: "+91 98765 43210",
    email: "ravi.kumar@kisanflow.in",
    village: "Amboli Village",
    taluka: "Sinnar",
    district: "Nashik",
    state: "Maharashtra",
    pincode: "422103",
    aadhaar: "XXXX-XXXX-4532",
    bankName: "State Bank of India",
    accountNo: "XXXX-XXXX-8721",
    ifsc: "SBIN0001234",
    landArea: "4.5 acres",
    cropTypes: "Wheat, Onion, Mango, Turmeric",
    fpoMembership: "Nashik Agri Producers FPO",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your KYC and farm details</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            editing
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          {editing ? (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-black">
            R
          </div>
          {editing && (
            <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{form.name}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            🌾 Verified Farmer · KisanFlow ID: KF-FRMR-2024-001
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
              KYC Verified ✓
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              FPO Member
            </span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Full Name", field: "name", icon: User },
            { label: "Mobile Number", field: "phone", icon: Phone },
            { label: "Email Address", field: "email", icon: Mail },
            { label: "Aadhaar (masked)", field: "aadhaar", icon: User },
          ].map(({ label, field, icon: Icon }) => (
            <div key={field}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {label}
              </label>
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

      {/* Address */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          Farm Location
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Village", field: "village" },
            { label: "Taluka", field: "taluka" },
            { label: "District", field: "district" },
            { label: "State", field: "state" },
            { label: "PIN Code", field: "pincode" },
            { label: "Land Area", field: "landArea" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {label}
              </label>
              <input
                type="text"
                value={form[field as keyof typeof form]}
                disabled={!editing}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-default"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Primary Crops
          </label>
          <input
            type="text"
            value={form.cropTypes}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, cropTypes: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-default"
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-slate-500" />
          Bank Account (DBT Linked)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Bank Name", field: "bankName" },
            { label: "Account Number (masked)", field: "accountNo" },
            { label: "IFSC Code", field: "ifsc" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {label}
              </label>
              <input
                type="text"
                value={form[field as keyof typeof form]}
                disabled={!editing}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-default"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
