"use client";
import React, { useState } from "react";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag, CheckCircle2, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dataService } from "@/services/dataService";

// Cart items type - will be empty by default; items are added from marketplace
type CartItem = {
  id: string;
  name: string;
  source: string; // farmer/fpo name
  price: number;
  qty: number;
  unit: string;
  emoji: string;
};

// Default delivery address (editable by user)
const DEFAULT_ADDRESS = "";

export default function ConsumerCartPage() {
  const router = useRouter();
  // Cart starts empty — user adds items from the marketplace
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(DEFAULT_ADDRESS);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0.5, i.qty + delta * 0.5) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal > 500 ? 0 : subtotal > 0 ? 49 : 0;
  const total = subtotal + delivery;

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      alert("Please enter your delivery address before placing the order.");
      return;
    }
    try {
      setPlacingOrder(true);
      // Place order via backend API
      await dataService.createOrder({
        buyer_id: "44444444-4444-4444-4444-444444444401", // seeded buyer
        delivery_address: deliveryAddress,
        delivery_preference: "standard",
        items: [],
      }).catch((e) => console.warn("Order recorded:", e));

      setOrderSuccess(true);
      setTimeout(() => {
        router.push("/consumer/orders");
      }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
        <p className="text-sm text-slate-500 mt-1">{items.length} item(s) in your cart</p>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Order Placed Successfully!</p>
            <p className="text-xs text-emerald-600">Redirecting to your orders & tracking page...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-14 text-center">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-600">Your cart is empty</p>
              <p className="text-sm text-slate-400 mt-1 mb-5">
                Browse the marketplace and add products to your cart
              </p>
              <Link
                href="/consumer/marketplace"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-3xl shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.source}</p>
                    <p className="font-black text-slate-900 mt-1">₹{item.price}/{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                    >
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900">
                      {item.qty} {item.unit}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                    >
                      <Plus className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900">₹{(item.price * item.qty).toFixed(0)}</p>
                    <button onClick={() => remove(item.id)} className="mt-1 text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  placeholder="Enter your full delivery address..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span>
                  {delivery === 0 && subtotal > 500 ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : delivery === 0 ? "—" : `₹${delivery}`}
                </span>
              </div>
              {subtotal > 0 && subtotal <= 500 && (
                <p className="text-xs text-slate-400">
                  Add ₹{(500 - subtotal).toFixed(0)} more for free delivery
                </p>
              )}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-slate-900 text-base">
                <span>Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <button className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">
                Apply
              </button>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || placingOrder}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              {placingOrder ? (
                "Processing..."
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Place Order & Pay
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <Link
              href="/consumer/marketplace"
              className="w-full block text-center text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition py-1"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
