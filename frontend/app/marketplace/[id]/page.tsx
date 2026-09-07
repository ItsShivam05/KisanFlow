"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { productService } from "@/services/productService";
import { Product } from "@/types/product";
import { ArrowLeft, Tag, Package, Calendar, Sprout, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Buy Modal State
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyQty, setBuyQty] = useState(10);
  const [deliveryAddress, setDeliveryAddress] = useState("Sanwer APMC Logistics Hub, Indore, MP");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const estimatedUnitRate =
    product?.category === "Grains"
      ? 3850
      : product?.category === "Fruits"
      ? 950
      : 45;

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-6 w-32 bg-slate-200 rounded-md mb-8 animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs animate-pulse">
          <div className="h-5 w-24 bg-emerald-100 rounded-full mb-4"></div>
          <div className="h-8 w-2/3 bg-slate-200 rounded-md mb-4"></div>
          <div className="h-4 w-full bg-slate-100 rounded-md mb-2"></div>
          <div className="h-4 w-4/5 bg-slate-100 rounded-md mb-8"></div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="h-16 bg-slate-50 rounded-xl"></div>
            <div className="h-16 bg-slate-50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>
        <ErrorState
          title="Product not found"
          message={error || `Could not find product with ID: ${id}`}
        />
      </div>
    );
  }

  const formattedDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const formattedUpdated = product.updated_at
    ? new Date(product.updated_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Back button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-600">
              <Tag className="w-3 h-3" />
              {product.category || "General Agriculture"}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Verified Catalog Item
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {product.name}
          </h1>

          <p className="mt-1 text-xs text-emerald-200 font-mono">
            ID: {product.id}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Description */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Product Overview & Specifications
            </h2>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              {product.description ||
                "No custom description provided for this agricultural product."}
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Package className="w-4 h-4 text-emerald-600" />
                Standard Unit
              </div>
              <p className="text-lg font-bold text-slate-900 capitalize">
                Per {product.unit || "kg"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Listed Date
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formattedDate}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Sprout className="w-4 h-4 text-emerald-600" />
                Supply Status
              </div>
              <p className="text-lg font-bold text-emerald-700">
                Ready for Inventory
              </p>
            </div>
          </div>

          {/* Buy / Procurement CTA */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">Direct Sourcing Price Guide</p>
              <p className="text-2xl font-black text-slate-900">
                ₹{product.category === "Grains" ? "3,850" : product.category === "Fruits" ? "950" : "45"} 
                <span className="text-xs font-normal text-slate-500 ml-1">per {product.unit || "kg"}</span>
              </p>
            </div>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Procure / Buy This Produce
            </button>
          </div>

          {/* Audit Metadata */}
          {formattedUpdated && (
            <div className="text-xs text-slate-400 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span>Last updated: {formattedUpdated}</span>
              <span className="text-emerald-700 font-medium">KisanFlow Supply-Chain Network</span>
            </div>
          )}
        </div>
      </div>

      {/* Buy Modal */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {orderSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your purchase order for <b>{buyQty} {product.unit || "kg"}</b> of <b>{product.name}</b> has been received and scheduled for farm pickup.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsBuyModalOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Order Produce</h3>
                  <button
                    onClick={() => setIsBuyModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 pt-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Product</p>
                    <p className="text-sm font-bold text-slate-900">{product.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Procurement Quantity ({product.unit || "kg"})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={buyQty}
                      onChange={(e) => setBuyQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter warehouse or delivery location"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Rate:</span>
                      <span>₹{estimatedUnitRate} / {product.unit || "kg"}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Quantity:</span>
                      <span>{buyQty} {product.unit || "kg"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                      <span>Total Value:</span>
                      <span className="text-emerald-700">₹{(buyQty * estimatedUnitRate).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBuyModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderSuccess(true)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      Confirm Order
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
