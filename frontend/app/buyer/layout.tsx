"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Store,
  ClipboardList,
  ShoppingBag,
  Truck,
  IndianRupee,
  BarChart3,
  User,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sprout,
} from "lucide-react";

const navItems = [
  { href: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/buyer/marketplace", label: "Marketplace", icon: Store },
  { href: "/buyer/procurement", label: "Bulk Procurement", icon: ClipboardList },
  { href: "/buyer/requests", label: "Procurement Requests", icon: Building2 },
  { href: "/buyer/orders", label: "Orders", icon: ShoppingBag },
  { href: "/buyer/tracking", label: "Tracking", icon: Truck },
  { href: "/buyer/pricing", label: "Price Breakdown", icon: IndianRupee },
  { href: "/buyer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/buyer/profile", label: "Company Profile", icon: User },
];

export default function BuyerPortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-slate-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/70">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">KisanFlow</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800/50">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">🏢 B2B Buyer</p>
            <p className="text-sm font-bold text-white mt-0.5">Reliance Retail Ltd.</p>
            <p className="text-xs text-slate-400">Mumbai · GST Verified</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-amber-300" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800/60">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-900 p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs text-slate-400 font-medium">
              Institutional Buyer · <span className="text-slate-700 font-semibold">Reliance Retail Ltd.</span>
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center">R</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
