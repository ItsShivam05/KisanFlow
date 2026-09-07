"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sprout,
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  IndianRupee,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/farmer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farmer/produce", label: "My Produce", icon: Sprout },
  { href: "/farmer/inventory", label: "Inventory", icon: Warehouse },
  { href: "/farmer/orders", label: "Orders", icon: ShoppingBag },
  { href: "/farmer/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/farmer/profile", label: "Profile", icon: User },
  { href: "/farmer/notifications", label: "Notifications", icon: Bell },
];

export default function FarmerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-emerald-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-emerald-800/60">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">KisanFlow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-emerald-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3">
          <div className="px-3 py-2 rounded-lg bg-emerald-900/60 border border-emerald-800/50">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              🌾 Farmer Portal
            </p>
            <p className="text-sm font-bold text-white mt-0.5">Ravi Kumar</p>
            <p className="text-xs text-emerald-300">Nashik, Maharashtra</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-200 hover:bg-emerald-900/60 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto text-emerald-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-emerald-800/60">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-900 p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs text-slate-400 font-medium">
              Welcome back,{" "}
              <span className="text-slate-700 font-semibold">Ravi Kumar</span>
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="/farmer/notifications"
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
              R
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
