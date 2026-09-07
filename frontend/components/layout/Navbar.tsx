"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "🌾 Farmer Portal", href: "/farmer/dashboard" },
    { name: "🏢 Buyer Portal", href: "/buyer/dashboard" },
    { name: "🛒 Consumer Portal", href: "/consumer/home" },
    { name: "Network", href: "/network" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Quick Role Switcher Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">Switch Role View:</span>
          <div className="flex items-center gap-3">
            <Link href="/farmer/dashboard" className="hover:text-emerald-300 transition-colors">
              🚜 Farmer
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/buyer/dashboard" className="hover:text-emerald-300 transition-colors">
              🏢 Institutional Buyer
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/consumer/home" className="hover:text-emerald-300 transition-colors">
              🛒 Consumer
            </Link>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <span>Backend Connected:</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] text-emerald-400 font-mono">localhost:5000</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Kisan<span className="text-emerald-600">Flow</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-sm uppercase tracking-wider">
                India
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide block">
              Digital Farm-to-Market Network
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-all ${
                  isActive
                    ? "text-emerald-700 bg-emerald-50/80 font-bold"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/farmer/produce"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all"
          >
            + Farmer Add Item
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all"
          >
            Buy Produce
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-emerald-700 bg-emerald-50 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-xs"
            >
              Browse Marketplace Directory
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
