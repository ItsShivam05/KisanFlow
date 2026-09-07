import React from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { Package, ArrowRight, Tag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formattedDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div className="p-5">
        {/* Category & Unit Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Tag className="w-3 h-3" />
            {product.category || "General Produce"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
            <Package className="w-3 h-3" />
            Per {product.unit || "kg"}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {product.description || "Direct harvest farm product available for procurement."}
        </p>
      </div>

      {/* Card Footer with Details Link */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {formattedDate ? `Listed ${formattedDate}` : "Available now"}
        </span>
        <Link
          href={`/marketplace/${product.id}`}
          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold group-hover:translate-x-0.5 transition-transform"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
