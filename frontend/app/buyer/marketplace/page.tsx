"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Leaf, CheckCircle2, Package, RefreshCw } from "lucide-react";
import { productService } from "@/services/productService";
import { dataService } from "@/services/dataService";
import { Product, InventoryItem } from "@/types/product";

const emojiMap: Record<string, string> = {
  Grains: "🌾",
  Fruits: "🥭",
  Vegetables: "🧅",
  Spices: "🌶️",
  Pulses: "🫘",
  Oilseeds: "🌻",
};

const qualityBadge: Record<string, string> = {
  "Grade A": "bg-emerald-100 text-emerald-700",
  "Organic Certified": "bg-green-100 text-green-700",
  "GI Grade-1": "bg-violet-100 text-violet-700",
  "Export Dry Grade": "bg-blue-100 text-blue-700",
  "Fancy Royal": "bg-amber-100 text-amber-700",
  "Bold Grade A": "bg-emerald-100 text-emerald-700",
};

export default function BuyerMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requested, setRequested] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, inv] = await Promise.all([
        productService.getProducts(),
        dataService.getInventory(),
      ]);
      setProducts(prods || []);
      setInventory(inv || []);
    } catch (e) {
      console.error("Failed to load buyer marketplace:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getProductInfo = (productId: string) =>
    products.find((p) => p.id === productId);

  const filtered = inventory.filter((inv) => {
    const product = getProductInfo(inv.product_id);
    if (!product) return false;
    const q = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      (product.category || "").toLowerCase().includes(q) ||
      (product.description || "").toLowerCase().includes(q)
    );
  });

  const handleRequest = (invId: string, name: string) => {
    setRequested((prev) => [...prev, invId]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">B2B Produce Marketplace</h1>
          <p className="text-sm text-slate-500 mt-1">Live inventory lots from verified FPOs & farm collectives · Neon PostgreSQL</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-600" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search produce or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:border-slate-300 transition">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading live procurement catalog from PostgreSQL database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No inventory lots found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv) => {
            const product = getProductInfo(inv.product_id);
            if (!product) return null;
            const emoji = emojiMap[product.category || ""] || "🌾";
            const isRequested = requested.includes(inv.id);

            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-200 transition-all">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="text-4xl">{emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                      {product.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          <Leaf className="w-3 h-3" /> {product.category}
                        </span>
                      )}
                      {inv.quality && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${qualityBadge[inv.quality] || "bg-slate-100 text-slate-600"}`}>
                          {inv.quality}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{product.description}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Available Qty</p>
                        <p className="text-sm font-bold text-slate-900">
                          {parseFloat(String(inv.available_quantity)).toLocaleString("en-IN")} {product.unit}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Price per {product.unit}</p>
                        <p className="text-sm font-bold text-slate-900">
                          ₹{parseFloat(String(inv.price_per_unit)).toLocaleString("en-IN")}
                        </p>
                      </div>
                      {inv.harvest_date && (
                        <>
                          <div className="w-px h-8 bg-slate-200" />
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Harvest Date</p>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(inv.harvest_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </p>
                          </div>
                        </>
                      )}
                      {inv.available_until && (
                        <>
                          <div className="w-px h-8 bg-slate-200" />
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Available Until</p>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(inv.available_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col gap-2 items-end">
                    <p className="text-xl font-black text-slate-900">
                      ₹{parseFloat(String(inv.price_per_unit)).toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-slate-400">/{product.unit}</span>
                    </p>
                    {isRequested ? (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Request Sent
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequest(inv.id, product.name)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Request Bulk Procurement
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
