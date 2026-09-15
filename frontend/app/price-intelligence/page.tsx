"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { aiApiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

type ForecastItem = {
  horizon_day: number;
  date: string;
  predicted_price: number;
  lower_estimate: number;
  upper_estimate: number;
  price_change_vs_current: number;
};

type PricePredictResponse = {
  commodity: string;
  region: string;
  current_price: number;
  forecast_days: number;
  model: string;
  predictions: ForecastItem[];
  explainability_factors: string[];
  recommendation: string;
  optimal_wait_days: number;
  expected_net_gain_per_kg: number;
  recommended_net_realization: number;
  decision_rationale: string;
  assumptions: string[];
  disclaimer: string;
};

type MarketOption = {
  market: string;
  mandi_name: string;
  distance_km: number;
  predicted_price: number;
  transport_cost_per_kg: number;
  handling_and_holding_per_kg: number;
  expected_net_realization: number;
  total_expected_net_profit: number;
  consumer_affordability_alert: boolean;
  recommended: boolean;
};

type ProfitAdvisorResponse = {
  commodity: string;
  quantity_kg: number;
  farmer_location: string;
  recommendations: MarketOption[];
  top_recommended_market: string;
  max_net_realization: number;
  disclaimer: string;
};

type MarketAllocation = {
  market: string;
  allocated_quantity_kg: number;
  allocation_pct: number;
  expected_net_realization: number;
  projected_net_revenue: number;
  reason: string;
};

type MarketAllocationResponse = {
  commodity: string;
  total_quantity_kg: number;
  allocations: MarketAllocation[];
  total_projected_net_profit: number;
  disclaimer: string;
};

const COMMODITIES = ["Tomato", "Potato", "Onion", "Green Chilli"];
const MARKETS = [
  "Ranchi",
  "Jamshedpur",
  "Dhanbad",
  "Bokaro",
  "Hazaribagh",
  "Deoghar",
  "Dumka",
];

export default function PriceIntelligencePage() {
  const [commodity, setCommodity] = useState("Tomato");
  const [region, setRegion] = useState("Ranchi");
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [farmerLocation, setFarmerLocation] = useState("Hazaribagh");
  const [quantityKg, setQuantityKg] = useState<number>(2000);

  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);
  const [error, setError] = useState("");

  const [forecastData, setForecastData] = useState<PricePredictResponse | null>(null);
  const [advisorData, setAdvisorData] = useState<ProfitAdvisorResponse | null>(null);
  const [allocationData, setAllocationData] = useState<MarketAllocationResponse | null>(null);

  // Load Price Forecast
  async function loadPriceForecast() {
    setLoadingForecast(true);
    setError("");
    try {
      const data = await aiApiRequest<PricePredictResponse>("/price-predict", {
        method: "POST",
        body: JSON.stringify({
          commodity,
          region,
          forecast_days: forecastDays,
          quantity_kg: quantityKg,
          farmer_location: farmerLocation,
        }),
      });
      setForecastData(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch price forecast.");
    } finally {
      setLoadingForecast(false);
    }
  }

  // Load Farmer Profit Advisor & Market Allocation
  async function loadProfitAdvisor() {
    setLoadingAdvisor(true);
    try {
      const advPromise = aiApiRequest<ProfitAdvisorResponse>(
        "/farmer-profit-recommendation",
        {
          method: "POST",
          body: JSON.stringify({
            commodity,
            quantity_kg: quantityKg,
            farmer_location: farmerLocation,
          }),
        }
      );

      const allocPromise = aiApiRequest<MarketAllocationResponse>(
        "/market-allocation",
        {
          method: "POST",
          body: JSON.stringify({
            commodity,
            quantity_kg: quantityKg,
            farmer_location: farmerLocation,
            max_single_market_share: 0.5,
          }),
        }
      );

      const [advData, allocData] = await Promise.all([advPromise, allocPromise]);
      setAdvisorData(advData);
      setAllocationData(allocData);
    } catch (err: any) {
      console.error("Advisor load error:", err);
    } finally {
      setLoadingAdvisor(false);
    }
  }

  useEffect(() => {
    loadPriceForecast();
    loadProfitAdvisor();
  }, [commodity, region, forecastDays]);

  return (
    <AppShell backHref="/dashboard" backLabel="Dashboard">
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-leaf-700">
              Decision Support System • Pilot Geography: Jharkhand
            </span>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
              Agricultural Price Intelligence & Farmer Profit Advisor
            </h1>
            <p className="text-sm text-stone-600 mt-1.5 max-w-2xl">
              XGBoost regional mandi price forecasting benchmarked against naive baselines, connected to
              distance-aware transport, holding, and spoilage economic models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadPriceForecast();
                loadProfitAdvisor();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-leaf-700 text-white shadow-sm hover:bg-leaf-600 transition"
            >
              🔄 Refresh Intelligence
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={loadPriceForecast} className="font-semibold underline text-xs">Try again</button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: PRICE INTELLIGENCE CONTROLS & KPIS           */}
        {/* ======================================================== */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>📈</span> Regional Price Intelligence
              </h2>
              <p className="text-xs text-stone-500">
                Primary model: XGBoost (out-of-sample chronological evaluation)
              </p>
            </div>

            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5 font-medium text-stone-700">
                Crop:
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 shadow-sm focus:border-leaf-600 focus:outline-none"
                >
                  {COMMODITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 font-medium text-stone-700">
                Mandi:
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 shadow-sm focus:border-leaf-600 focus:outline-none"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>{m} APMC</option>
                  ))}
                </select>
              </label>

              <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                {[1, 3, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => setForecastDays(d)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      forecastDays === d
                        ? "bg-white text-leaf-700 shadow-sm border border-stone-200"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {d} {d === 1 ? "Day" : "Days"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          {loadingForecast ? (
            <div className="py-12 text-center text-leaf-700 font-medium animate-pulse">
              Running recursive XGBoost price forecasting model...
            </div>
          ) : forecastData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Current Price */}
                <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-5">
                  <span className="text-xs font-semibold uppercase text-stone-500">Current Spot Price</span>
                  <div className="text-3xl font-extrabold text-stone-900 mt-1">
                    ₹{forecastData.current_price.toFixed(2)}
                    <span className="text-sm font-normal text-stone-500"> / kg</span>
                  </div>
                  <span className="text-xs text-stone-500 mt-2 block">{region} APMC Mandi</span>
                </div>

                {/* Predicted Price */}
                <div className="rounded-xl border border-leaf-500/30 bg-leaf-50/50 p-5">
                  <span className="text-xs font-semibold uppercase text-leaf-700">
                    Day {forecastDays} Projected Price
                  </span>
                  <div className="text-3xl font-extrabold text-leaf-900 mt-1 flex items-baseline gap-2">
                    ₹{forecastData.predictions[forecastDays - 1]?.predicted_price.toFixed(2) || "--"}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-leaf-100 text-leaf-700">
                      {forecastData.predictions[forecastDays - 1]?.price_change_vs_current >= 0 ? "+" : ""}
                      {forecastData.predictions[forecastDays - 1]?.price_change_vs_current.toFixed(2)} ₹/kg
                    </span>
                  </div>
                  <span className="text-xs text-leaf-600 mt-2 block">
                    Expected on {forecastData.predictions[forecastDays - 1]?.date}
                  </span>
                </div>

                {/* Estimated Prediction Range */}
                <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-5">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Estimated Prediction Range
                  </span>
                  <div className="text-2xl font-bold text-stone-900 mt-1">
                    ₹{forecastData.predictions[forecastDays - 1]?.lower_estimate.toFixed(1)} – ₹
                    {forecastData.predictions[forecastDays - 1]?.upper_estimate.toFixed(1)}
                    <span className="text-xs font-normal text-stone-500"> / kg</span>
                  </div>
                  <span className="text-xs text-stone-500 mt-2 block">
                    10th–90th percentile validation residual dispersion
                  </span>
                </div>

                {/* Sell Now vs Wait Recommendation */}
                <div
                  className={`rounded-xl p-5 border ${
                    forecastData.recommendation.startsWith("WAIT")
                      ? "border-amber-400 bg-amber-50/60 text-amber-900"
                      : "border-leaf-500 bg-leaf-50/60 text-leaf-900"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Timing Recommendation
                  </span>
                  <div className="text-2xl font-black mt-1 flex items-center gap-2">
                    {forecastData.recommendation.startsWith("WAIT") ? "⏳ " : "🚀 "}
                    {forecastData.recommendation.replace("_", " ")}
                  </div>
                  <p className="text-xs mt-2 font-medium opacity-90">
                    {forecastData.decision_rationale}
                  </p>
                </div>
              </div>

              {/* Price Trajectory Timeline */}
              <div className="border border-stone-200 rounded-xl p-5 bg-stone-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-800">
                    7-Day Forward Price Trajectory & Error Range
                  </h3>
                  <span className="text-xs text-stone-500">Recursive multi-step forecast</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                  {forecastData.predictions.map((p) => {
                    const isUp = p.price_change_vs_current >= 0;
                    return (
                      <div
                        key={p.horizon_day}
                        className="rounded-lg border border-stone-200 bg-white p-3 text-center shadow-xs"
                      >
                        <span className="text-[11px] font-semibold text-stone-400 block uppercase">
                          Day {p.horizon_day} • {p.date.slice(5)}
                        </span>
                        <div className="text-lg font-bold text-stone-900 mt-1">
                          ₹{p.predicted_price.toFixed(2)}
                        </div>
                        <span
                          className={`text-[11px] font-semibold block mt-0.5 ${
                            isUp ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isUp ? "▲ +" : "▼ "}
                          {p.price_change_vs_current.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-stone-500 mt-1 pt-1 border-t border-stone-100">
                          [{p.lower_estimate.toFixed(1)}–{p.upper_estimate.toFixed(1)}]
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explainability Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Key Prediction Drivers & Market Factors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {forecastData.explainability_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700"
                    >
                      <span>💡</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: FARMER PROFIT ADVISOR                        */}
        {/* ======================================================== */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-soft space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>💰</span> Farmer Profit Advisor (Net Realization Optimizer)
              </h2>
              <p className="text-xs text-stone-500">
                Expected Net Realization = Selling Price - Transport - Holding - Handling - Wastage
              </p>
            </div>

            {/* Farmer Inputs */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5 font-medium text-stone-700">
                Farmer Origin:
                <select
                  value={farmerLocation}
                  onChange={(e) => setFarmerLocation(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 shadow-sm focus:border-leaf-600 focus:outline-none"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>{m} Region</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 font-medium text-stone-700">
                Harvest Qty:
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(Number(e.target.value))}
                  className="w-24 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-stone-800 shadow-sm focus:border-leaf-600 focus:outline-none"
                />
                <span className="text-xs text-stone-500">kg</span>
              </label>

              <button
                onClick={loadProfitAdvisor}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 text-white hover:bg-stone-700 transition shadow-xs"
              >
                Recalculate
              </button>
            </div>
          </div>

          {/* Market Comparison Table */}
          {loadingAdvisor ? (
            <div className="py-12 text-center text-leaf-700 font-medium animate-pulse">
              Calculating distance matrix, route logistics, and net realization...
            </div>
          ) : advisorData ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-bold uppercase text-stone-500 bg-stone-50">
                      <th className="py-3 px-4">Market / Mandi</th>
                      <th className="py-3 px-3">Distance</th>
                      <th className="py-3 px-3">Predicted Price</th>
                      <th className="py-3 px-3">Transport</th>
                      <th className="py-3 px-3">Holding/Wastage</th>
                      <th className="py-3 px-4">Net Realization</th>
                      <th className="py-3 px-4">Total Net Profit</th>
                      <th className="py-3 px-4 text-center">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {advisorData.recommendations.map((opt) => (
                      <tr
                        key={opt.market}
                        className={`transition ${
                          opt.recommended
                            ? "bg-leaf-50/70 font-semibold"
                            : "hover:bg-stone-50/50"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{opt.market}</div>
                          <div className="text-xs text-stone-500">{opt.mandi_name}</div>
                        </td>
                        <td className="py-3.5 px-3 text-stone-600">
                          {opt.distance_km.toFixed(1)} km
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-stone-900">
                          ₹{opt.predicted_price.toFixed(2)}/kg
                        </td>
                        <td className="py-3.5 px-3 text-rose-600 text-xs">
                          -₹{opt.transport_cost_per_kg.toFixed(2)}/kg
                        </td>
                        <td className="py-3.5 px-3 text-amber-700 text-xs">
                          -₹{opt.handling_and_holding_per_kg.toFixed(2)}/kg
                        </td>
                        <td className="py-3.5 px-4 text-base font-black text-leaf-900">
                          ₹{opt.expected_net_realization.toFixed(2)}/kg
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          ₹{opt.total_expected_net_profit.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {opt.recommended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-leaf-700 text-white shadow-xs">
                              ★ RECOMMENDED
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400 font-medium">Alternative</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Balanced Market Volume Allocation (Oversupply Protection) */}
              {allocationData && allocationData.allocations.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <span>🌐</span> Multi-Market Volume Allocation
                      </h3>
                      <p className="text-xs text-stone-500">
                        Distributes farmer harvest to prevent oversupplying one mandi and depressing local prices.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700">
                      Total Batch: {quantityKg.toLocaleString()} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {allocationData.allocations.map((alloc) => (
                      <div
                        key={alloc.market}
                        className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-sm">{alloc.market} Mandi</span>
                          <span className="text-xs font-extrabold text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded">
                            {alloc.allocation_pct}%
                          </span>
                        </div>
                        <div className="text-xs text-stone-600">
                          Allocated Volume: <strong>{alloc.allocated_quantity_kg.toLocaleString()} kg</strong>
                        </div>
                        <div className="text-xs text-stone-600">
                          Net Rate: <strong>₹{alloc.expected_net_realization.toFixed(2)}/kg</strong>
                        </div>
                        <div className="text-xs font-semibold text-leaf-900 pt-1 border-t border-stone-100">
                          Projected Revenue: ₹{alloc.projected_net_revenue.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* Disclaimer Card */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-500 leading-relaxed">
          <p>
            <strong>Transparent Decision Support Notice:</strong> The KisanFlow system estimates future regional
            prices and expected net realizations to support more profitable selling decisions. Predictions are
            generated by an XGBoost model evaluated chronologically against naive moving average baselines.
            Prediction ranges represent empirical validation error bounds and do not guarantee future market prices
            or farmer profit.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
