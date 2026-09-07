import React from "react";

interface LoadingStateProps {
  message?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading fresh produce...",
  count = 6,
}) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-center space-x-3 mb-8">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-800 font-medium">{message}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-emerald-100 p-5 shadow-xs animate-pulse"
          >
            <div className="h-4 bg-emerald-100/70 rounded-full w-1/3 mb-4"></div>
            <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-3"></div>
            <div className="h-4 bg-slate-100 rounded-md w-full mb-2"></div>
            <div className="h-4 bg-slate-100 rounded-md w-2/3 mb-6"></div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="h-4 bg-slate-200 rounded-md w-20"></div>
              <div className="h-8 bg-emerald-100 rounded-lg w-24"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
