"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Tag, Package, ArrowRight } from "lucide-react";
import { productService } from "@/services/productService";
import { Product } from "@/types/product";

const defaultCategories = ["All", "Grains", "Fruits", "Vegetables", "Spices", "Pulses", "Oilseeds"];

const emojiForCat: Record<string, string> = {
  Grains: "🌾",
  Fruits: "🥭",
  Vegetables: "🧅",
  Spices: "🌶️",
  Pulses: "🫘",
  Oilseeds: "🌻",
};

const priceEstimateForCat: Record<string, number> = {
  Grains: 38,
  Fruits: 95,
  Vegetables: 24,
  Spices: 130,
  Pulses: 68,
  Oilseeds: 75,
};

export default function ConsumerMarketplacePage() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<string[]>([]);
  const [addedNotice, setAddedNotice] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        setDbProducts(data);
      } catch (e) {
        console.error("Failed to load products from DB", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product.id]);
    setAddedNotice(`✓ Added "${product.name}" to cart!`);
    setTimeout(() => setAddedNotice(""), 3000);
  };

  const filtered = dbProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === "All" || (p.category && p.category.toLowerCase() === category.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Farm Fresh Marketplace</h1>
          <p className="text-sm text-slate-500 mt-1">Live commodities from Neon PostgreSQL Database</p>
        </div>
        <Link
          href="/consumer/cart"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <ShoppingCart className="w-4 h-4" />
          View Cart ({cart.length})
        </Link>
      </div>

      {addedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          {addedNotice}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search verified crops & commodities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {defaultCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === cat
                ? "bg-emerald-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid from Database */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading agricultural catalog from database...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const emoji = (p.category && emojiForCat[p.category]) || "🌾";
            const approxPrice = (p.category && priceEstimateForCat[p.category]) || 50;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-full h-32 bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center text-5xl">
                    {emoji}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </p>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold">
                        <Tag className="w-2.5 h-2.5" />
                        {p.category || "General"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {p.description || "Direct harvest farm product available for procurement."}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <p className="font-black text-slate-900 text-base">
                        ₹{approxPrice}
                        <span className="text-xs font-normal text-slate-400">/{p.unit}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/marketplace/${p.id}`}
                        className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => addToCart(p)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">🌾</p>
              <p className="text-sm font-medium">No products found in database</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
