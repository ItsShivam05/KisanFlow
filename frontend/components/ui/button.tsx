import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary"; children: ReactNode };

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const styles = variant === "primary" ? "bg-leaf-700 text-white hover:bg-leaf-900" : "border border-leaf-700 bg-white text-leaf-700 hover:bg-leaf-50";
  return <button className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:ring-offset-2 ${styles} ${className}`} {...props}>{children}</button>;
}
