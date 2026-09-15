import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const variantStyles = {
  primary:
    "bg-leaf-700 text-white shadow-sm hover:bg-leaf-800 focus:ring-leaf-500 active:scale-[0.98]",
  secondary:
    "border border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50 hover:border-stone-400 focus:ring-leaf-500 active:scale-[0.98]",
  outline:
    "border border-leaf-700 text-leaf-700 hover:bg-leaf-50 focus:ring-leaf-500 active:scale-[0.98]",
  ghost:
    "text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:ring-stone-400",
};

const sizeStyles = {
  sm: "px-3.5 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-semibold
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
