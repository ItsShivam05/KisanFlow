import React from "react";
import { Sprout, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No products found",
  description = "We couldn't find any agricultural products matching your criteria.",
  onReset,
}) => {
  return (
    <div className="w-full py-16 px-4 text-center bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200">
      <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-xs">
        <Sprout className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 max-w-md mx-auto text-sm mb-6">{description}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Clear filters
        </button>
      )}
    </div>
  );
};
