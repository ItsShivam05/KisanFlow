"use client";
import React, { useState } from "react";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";

const pendingReviews = [
  { id: 1, name: "Alphonso Mangoes", farm: "Ravi Kumar Farm, Nashik", orderId: "CONS-ORD-001", emoji: "🥭" },
];

const pastReviews = [
  {
    id: 1,
    name: "Red Onion",
    farm: "Sangli FPO",
    rating: 5,
    review: "Super fresh! Crispy and sharp — way better than supermarket onions.",
    date: "Sep 06, 2026",
    helpful: 12,
    emoji: "🧅",
  },
  {
    id: 2,
    name: "Sharbati Wheat",
    farm: "MP Agri Co-op",
    rating: 4,
    review: "Great quality wheat. Chapatis came out very soft. Slightly late delivery but overall happy.",
    date: "Sep 04, 2026",
    helpful: 8,
    emoji: "🌾",
  },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)}>
          <Star
            className={`w-6 h-6 transition-colors ${s <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ConsumerRatingsPage() {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [reviews, setReviews] = useState<Record<number, string>>({});

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ratings & Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">Share your feedback and help other consumers</p>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3">
            Pending Review{pendingReviews.length > 1 ? "s" : ""}
          </h2>
          <div className="space-y-4">
            {pendingReviews.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{item.emoji}</div>
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.farm} · {item.orderId}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">Your Rating</p>
                    <StarPicker
                      value={ratings[item.id] || 0}
                      onChange={(v) => setRatings((r) => ({ ...r, [item.id]: v }))}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">Your Review (optional)</p>
                    <textarea
                      rows={3}
                      placeholder="Share your experience with this produce..."
                      value={reviews[item.id] || ""}
                      onChange={(e) => setReviews((r) => ({ ...r, [item.id]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                    />
                  </div>
                  <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition">
                    Submit Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Reviews */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">Your Reviews</h2>
        <div className="space-y-4">
          {pastReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{review.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{review.name}</p>
                      <p className="text-xs text-slate-400">{review.farm} · {review.date}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{review.review}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <button className="flex items-center gap-1 hover:text-emerald-600 transition">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful ({review.helpful})
                    </button>
                    <button className="flex items-center gap-1 hover:text-slate-600 transition">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
