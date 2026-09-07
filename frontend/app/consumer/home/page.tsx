"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Store, ArrowRight, Star, Truck, ShieldCheck, Leaf, ShoppingCart } from "lucide-react";
import { productService } from "@/services/productService";
import { Product } from "@/types/product";

const categories = [
  { name: "Fresh Vegetables", emoji: "🥦", count: 48, catKey: "vegetables" },
  { name: "Fruits", emoji: "🍎", count: 32, catKey: "fruits" },
  { name: "Cereals & Grains", emoji: "🌾", count: 24, catKey: "grains" },
  { name: "Spices", emoji: "🌶️", count: 19, catKey: "spices" },
  { name: "Pulses & Lentils", emoji: "🫘", count: 16, catKey: "pulses" },
  { name: "Dairy & Organic", emoji: "🥛", count: 11, catKey: "dairy" },
];



export default function ConsumerHomePage() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    productService.getProducts()
      .then((items) => {
        if (items && items.length > 0) setDbProducts(items.slice(0, 4));
      })
      .catch((e) => console.error("Could not fetch DB featured products", e));
  }, []);

  const handleAddToCart = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setNotification(`✓ Added "${name}" to your cart!`);
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShoppingCart className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-slate-900 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFMwIDguMDYgMCAxOHM4LjA2IDE4IDE4IDE4IDE4LTguMDYgMTgtMTh6IiBmaWxsPSIjZmZmZmZmMDUiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300 mb-3">
            <Leaf className="w-3 h-3" />
            Farm-to-Table Direct
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Farm-Fresh Groceries,<br />
            <span className="text-emerald-400">Zero Middlemen.</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-md mb-5">
            Shop directly from verified Indian farmers. Fresher produce, fairer prices, and full traceability to the farm.
          </p>
          <Link
            href="/consumer/marketplace"
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all"
          >
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Truck, label: "Same-Day Delivery", desc: "Within 50 km of farm hubs" },
          { icon: ShieldCheck, label: "Quality Assured", desc: "FSSAI certified produce only" },
          { icon: Leaf, label: "Organic Options", desc: "Certified organic from 200+ farms" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Shop by Category</h2>
          <Link href="/consumer/marketplace" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/consumer/marketplace`}
              className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <p className="text-3xl mb-2">{cat.emoji}</p>
              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{cat.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{cat.count} items</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Featured Products</h2>
          <Link href="/consumer/marketplace" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
            Browse all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dbProducts.length > 0 ? (
            dbProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-28 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-3 text-4xl">
                    🌾
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-2">
                    <Leaf className="w-3 h-3" />
                    {p.category || "Fresh"}
                  </span>
                  <p className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description || "Farm-direct harvest"}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-black text-slate-900">₹{p.price_per_unit || 45}/{p.unit}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      4.8
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/marketplace/${p.id}`}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition text-center"
                  >
                    Details
                  </Link>
                  <button
                    onClick={(e) => handleAddToCart(e, p.name)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
              Fetching active harvested produce from PostgreSQL database...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
