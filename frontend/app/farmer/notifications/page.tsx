"use client";
import React from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, IndianRupee, Truck, Package } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "payment",
    title: "Payment Received",
    message: "₹1,40,000 credited for ORD-2026-002 (Wheat, 5 MT) — BigBasket Pvt. Ltd.",
    time: "2 hours ago",
    read: false,
    icon: IndianRupee,
    color: "emerald",
  },
  {
    id: 2,
    type: "order",
    title: "New Order Placed",
    message: "ITC Limited placed a new order for 1 MT Turmeric Fingers worth ₹1,20,000.",
    time: "5 hours ago",
    read: false,
    icon: Package,
    color: "blue",
  },
  {
    id: 3,
    type: "dispatch",
    title: "Shipment Dispatched",
    message: "Your Alphonso Mango batch (ORD-2026-001) has been picked up by Reefer Van #KF-12.",
    time: "1 day ago",
    read: true,
    icon: Truck,
    color: "violet",
  },
  {
    id: 4,
    type: "alert",
    title: "Quality Check Required",
    message: "Batch BT-2026-003 (Turmeric) requires lab certification before dispatch.",
    time: "2 days ago",
    read: true,
    icon: AlertTriangle,
    color: "amber",
  },
  {
    id: 5,
    type: "info",
    title: "Price Update",
    message: "Market price for Wheat (Grade A) has increased to ₹29/kg. Consider updating your listing.",
    time: "3 days ago",
    read: true,
    icon: Info,
    color: "slate",
  },
];

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-amber-100 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function FarmerNotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unread} unread notification{unread !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition">
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                notif.read
                  ? "bg-white border-slate-200"
                  : "bg-emerald-50/60 border-emerald-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[notif.color]}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">{notif.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
