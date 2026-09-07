import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Connection Error",
  message = "Failed to load products from server. Please check your network or try again.",
  onRetry,
}) => {
  return (
    <div className="w-full py-12 px-4 text-center bg-red-50/50 rounded-2xl border border-red-200">
      <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-xs">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 max-w-md mx-auto text-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
