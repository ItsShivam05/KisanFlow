"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { productService } from "@/services/productService";
import { Product } from "@/types/product";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Sprout, RefreshCw } from "lucide-react";

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError(err.message || "Failed to connect to KisanFlow backend API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Extract unique categories from real product data
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        set.add(p.category);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products client-side for smooth search/filter UX
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesCategory =
        !selectedCategory ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 mb-3">
            <Sprout className="w-3.5 h-3.5" />
            Agricultural Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Produce & Commodity Directory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
            Explore verified crops, grains, fruits, and commodities directly sourced from farmers and FPOs.
          </p>
        </div>

        <button
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Refresh Listings
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-8">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />
      </div>

      {/* Content States */}
      {loading ? (
        <LoadingState message="Connecting to Neon DB & loading products..." count={6} />
      ) : error ? (
        <ErrorState
          title="Unable to load produce"
          message={error}
          onRetry={loadProducts}
        />
      ) : (
        <ProductGrid
          products={filteredProducts}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
}
