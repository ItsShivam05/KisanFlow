"use client";
import React, { useState, useEffect } from "react";
import { Warehouse, Plus, AlertTriangle, CheckCircle2, Package, RefreshCw } from "lucide-react";
import { dataService } from "@/services/dataService";
import { InventoryItem } from "@/types/product";

const DEMO_FARMER_ID = "22222222-2222-2222-2222-222222222201";

const statusMap: Record<string, { label: string; cls: string }> = {
  available: { label: "In Stock", cls: "bg-emerald-100 text-emerald-700" },
  dispatched: { label: "Dispatched", cls: "bg-blue-100 text-blue-700" },
  low_stock: { label: "Low Stock", cls: "bg-amber-100 text-amber-700" },
  sold: { label: "Sold Out", cls: "bg-slate-100 text-slate-500" },
};

export default function FarmerInventoryPage() {
  const [dbItems, setDbItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const lots = await dataService.getFarmerInventory(DEMO_FARMER_ID);
      setDbItems(lots);
    } catch (e) {
      console.error("Error loading farmer inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const totalLots = dbItems.length;
  const totalStockQty = dbItems.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
  const totalAvailable = dbItems.reduce((acc, i) => acc + Number(i.available_quantity || 0), 0);
  const totalValue = dbItems.reduce((acc, i) => acc + Number(i.available_quantity || 0) * Number(i.price_per_unit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Godown Lots</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connected to Neon PostgreSQL &bull; Live warehouse storage lots
          </p>
        </div>
        <button
          onClick={loadInventory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Sync Lots
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-black text-slate-900">{totalStockQty.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Initial Units</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-black text-emerald-700">{totalAvailable.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-0.5">Available for Sale</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-black text-blue-700">{totalLots}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active Lots in DB</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-black text-amber-700">₹{totalValue.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Stock Value</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Database Storage Batches</h2>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
            Neon PostGIS DB Synced
          </span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading inventory lots from database...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Lot ID", "Product", "Category", "Available", "Price/Unit", "Quality Grade", "Harvest Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dbItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">
                      {item.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{item.product_name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800">
                      {item.available_quantity} {item.unit}
                    </td>
                    <td className="px-4 py-4 font-semibold text-emerald-700">
                      ₹{Number(item.price_per_unit).toLocaleString("en-IN")}/{item.unit}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded">
                        {item.quality || "Grade A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {item.harvest_date ? new Date(item.harvest_date).toLocaleDateString("en-IN") : "Fresh"}
                    </td>
                  </tr>
                ))}
                {dbItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                      No inventory lots found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
