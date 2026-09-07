import React from "react";
import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "../common/EmptyState";

interface ProductGridProps {
  products: Product[];
  onResetFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onResetFilters,
}) => {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No agricultural products found"
        description="Try adjusting your search keywords or removing category filters."
        onReset={onResetFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
