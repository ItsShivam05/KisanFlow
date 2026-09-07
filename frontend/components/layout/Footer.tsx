import React from "react";
import Link from "next/link";
import { Sprout, Mail, Phone, MapPin, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Kisan<span className="text-emerald-400">Flow</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering Indian agriculture by creating direct market access between verified farmers, Farmer Producer Organizations (FPOs), and institutional buyers with fair pricing and transparent logistics.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Neon PostgreSQL Database Connected
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/marketplace" className="hover:text-emerald-400 transition-colors">
                  Produce Directory
                </Link>
              </li>
              <li>
                <Link href="/farmers" className="hover:text-emerald-400 transition-colors">
                  For Farmers & FPOs
                </Link>
              </li>
              <li>
                <Link href="/buyers" className="hover:text-emerald-400 transition-colors">
                  For Institutional Buyers
                </Link>
              </li>
              <li>
                <Link href="/network" className="hover:text-emerald-400 transition-colors">
                  Supply Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link href="/about#principles" className="hover:text-emerald-400 transition-colors">
                  Fair Price Guarantee
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Regional Hubs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Regional Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Krishi Bhawan Complex, New Delhi & Pune Agritech Hub</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1800-KISAN-FLOW (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@kisanflow.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} KisanFlow Technologies. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with commitment for Indian Farmers</span>
            <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
