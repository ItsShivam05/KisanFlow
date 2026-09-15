"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventory", href: "/inventory" },
  { label: "Procurement", href: "/procurement/new" },
  { label: "Orders", href: "/orders" },
  { label: "Impact", href: "/impact" },
];

export function AppShell({ children, backHref, backLabel }: AppShellProps) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("kisanflow_token");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 lg:px-8">
          <a href="/dashboard" className="flex items-center gap-2.5 font-bold text-stone-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-700 text-xs font-bold text-white">K</span>
            KisanFlow
          </a>

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <button
            onClick={logout}
            className="text-sm font-medium text-stone-500 transition hover:text-stone-800"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Page */}
      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        {backHref && (
          <a href={backHref} className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            {backLabel || "Back"}
          </a>
        )}
        {children}
      </div>
    </div>
  );
}
