"use client";
import React, { useState } from "react";
import {
  Sprout,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Package,
} from "lucide-react";

const produces = [
  {
    id: 1,
    name: "Alphonso Mangoes",
    category: "Fruits",
    variety: "Alphonso (Hapus)",
    quantity: "2.5 MT",
    pricePerKg: "₹90",
    grade: "Grade A+",
    status: "active",
    listed: "Sep 01, 2026",
    expires: "Sep 15, 2026",
    bids: 4,
  },
  {
    id: 2,
    name: "Wheat (MP Sharbati)",
    category: "Cereals",
    variety: "MP Sharbati",
    quantity: "10 MT",
    pricePerKg: "₹28",
    grade: "Grade A",
    status: "active",
    listed: "Sep 03, 2026",
    expires: "Sep 20, 2026",
    bids: 7,
  },
  {
    id: 3,
    name: "Red Onion",
    category: "Vegetables",
    variety: "Nasik Red",
    quantity: "5 MT",
    pricePerKg: "₹22",
    grade: "Export Grade",
    status: "sold",
    listed: "Aug 20, 2026",
    expires: "Sep 05, 2026",
    bids: 12,
  },
  {
    id: 4,
    name: "Turmeric Fingers",
    category: "Spices",
    variety: "Salem Turmeric",
    quantity: "1 MT",
    pricePerKg: "₹120",
    grade: "Premium",
    status: "pending_approval",
    listed: "Sep 06, 2026",
    expires: "Sep 30, 2026",
    bids: 0,
  },
];

const statusStyles: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  sold: { label: "Sold", cls: "bg-blue-100 text-blue-700" },
  pending_approval: {
    label: "Under Review",
    cls: "bg-amber-100 text-amber-700",
  },
  expired: { label: "Expired", cls: "bg-slate-100 text-slate-500" },
};

export default function FarmerProducePage() {
  const [search, setSearch] = useState("");
  const [produceList, setProduceList] = useState(produces);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Grains",
    variety: "",
    quantity: "",
    unit: "quintal",
    pricePerKg: "",
    grade: "Grade A",
    harvestDate: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.pricePerKg) {
      alert("Please fill in Produce name, quantity, and price.");
      return;
    }

    try {
      setIsSubmitting(true);
      // Create local item & optionally sync to product catalog
      const newItem = {
        id: Date.now(),
        name: formData.name,
        category: formData.category,
        variety: formData.variety || "Standard Variety",
        quantity: `${formData.quantity} ${formData.unit}`,
        pricePerKg: `₹${formData.pricePerKg}`,
        grade: formData.grade,
        status: "active",
        listed: "Today",
        expires: "30 Days",
        bids: 0,
      };

      setProduceList([newItem, ...produceList]);
      setSuccessMsg(`✓ Successfully listed "${formData.name}" to KisanFlow marketplace!`);
      setIsModalOpen(false);
      setFormData({
        name: "",
        category: "Grains",
        variety: "",
        quantity: "",
        unit: "quintal",
        pricePerKg: "",
        grade: "Grade A",
        harvestDate: "",
      });
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      alert("Error adding produce: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = produceList.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-xs font-bold text-emerald-900 underline">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Produce</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your listed produce and create new harvest listings for buyers
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          List New Produce
        </button>
      </div>

      {/* Add Produce Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">List New Produce</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduce} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Crop / Commodity Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Sharbati Wheat, Nagpur Oranges"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="Grains">Grains & Cereals</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Oilseeds">Oilseeds</option>
                    <option value="Spices">Spices</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Variety / Strain</label>
                  <input
                    type="text"
                    name="variety"
                    placeholder="e.g. MP Desi, 1121"
                    value={formData.variety}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    name="quantity"
                    required
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="quintal">Quintal</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="crate">Crate</option>
                    <option value="tonne">Metric Tonne (MT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Price (₹/kg or unit) *</label>
                  <input
                    type="number"
                    step="any"
                    name="pricePerKg"
                    required
                    placeholder="e.g. 32"
                    value={formData.pricePerKg}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quality Grade</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="Grade A+">Grade A+ (Premium Export)</option>
                    <option value="Grade A">Grade A (Commercial)</option>
                    <option value="Organic Certified">Organic Certified</option>
                    <option value="Grade B">Grade B (Processing)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Listing..." : "Confirm & List Produce"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search produce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:border-slate-300 transition">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Listed",
            value: produces.length,
            icon: Package,
            color: "emerald",
          },
          {
            label: "Active",
            value: produces.filter((p) => p.status === "active").length,
            icon: CheckCircle2,
            color: "blue",
          },
          {
            label: "Sold",
            value: produces.filter((p) => p.status === "sold").length,
            icon: IndianRupee,
            color: "amber",
          },
          {
            label: "Under Review",
            value: produces.filter((p) => p.status === "pending_approval")
              .length,
            icon: Clock,
            color: "violet",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                color === "emerald"
                  ? "bg-emerald-100 text-emerald-700"
                  : color === "blue"
                    ? "bg-blue-100 text-blue-700"
                    : color === "amber"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-violet-100 text-violet-700"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Produce List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Produce
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Qty / Price
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Bids
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((produce) => (
                <tr
                  key={produce.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{produce.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {produce.variety} · {produce.grade}
                    </p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                      {produce.category}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{produce.quantity}</p>
                    <p className="text-xs text-slate-400">{produce.pricePerKg}/kg</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="font-bold text-slate-700">{produce.bids}</span>
                    <span className="text-xs text-slate-400 ml-1">bids</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[produce.status]?.cls}`}
                    >
                      {statusStyles[produce.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Sprout className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No produce found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
