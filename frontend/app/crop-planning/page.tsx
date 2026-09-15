"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { aiApiRequest } from "@/lib/api";

type CropEvaluation = {
  rank: number;
  crop: string;
  display_name: string;
  category: string;
  is_seasonally_suited: boolean;
  predicted_price: number;
  price_lower_bound: number;
  price_upper_bound: number;
  price_volatility_pct: number;
  expected_yield_kg_per_acre: number;
  total_yield_kg: number;
  expected_revenue: number;
  production_cost: number;
  transport_cost: number;
  holding_cost: number;
  expected_wastage_cost: number;
  expected_net_return: number;
  net_return_per_acre: number;
  benefit_cost_ratio: number;
  expected_regional_demand_kg: number;
  expected_demand?: number;
  harvest_share_of_demand_pct: number;
  market_condition: string;
  perishability_tier: string;
  shelf_life_days: number;
  risk_level: string;
  risk?: string;
  suitability: string;
  score: number;
  scores: {
    return_score: number;
    demand_score: number;
    price_stability_score: number;
    wastage_safety_score: number;
    transport_efficiency_score: number;
    agronomic_score: number;
    overall_score: number;
  };
};

type DiversificationAllocation = {
  crop: string;
  acres: number;
  fraction_pct: number;
  expected_yield_kg: number;
  expected_revenue: number;
  production_cost: number;
  expected_net_return: number;
  risk_level: string;
};

type DiversificationPlan = {
  total_acres: number;
  is_diversified: boolean;
  strategy: string;
  allocations: DiversificationAllocation[];
  portfolio_net_return: number;
  blended_net_return_per_acre: number;
  rationale: string;
};

type ExplainabilitySummary = {
  why_top_crop: string[];
  why_not_alternatives: {
    crop: string;
    rank: number;
    explanation: string;
  }[];
};

type CropRecommendationResponse = {
  region: string;
  season: string;
  land_area_acres: number;
  irrigation: boolean;
  scenario: string;
  top_crop: CropEvaluation;
  recommendations: CropEvaluation[];
  diversification_plan: DiversificationPlan;
  explainability: ExplainabilitySummary;
  scoring_weights_used: Record<string, number>;
};

type ScenarioItem = {
  key: string;
  name: string;
  description: string;
  icon: string;
};

const JHARKHAND_REGIONS = [
  "Ranchi",
  "Jamshedpur",
  "Dhanbad",
  "Bokaro",
  "Hazaribagh",
  "Deoghar",
  "Dumka",
];

const SEASONS = ["Rabi", "Kharif", "Zaid"];

const SCENARIOS_LIST: ScenarioItem[] = [
  { key: "NORMAL", name: "Normal Season", description: "Baseline expected prices & weather", icon: "🌤️" },
  { key: "PRICE_CRASH", name: "Price Crash", description: "35% crash in volatile vegetables", icon: "📉" },
  { key: "HEAVY_RAINFALL", name: "Excess Monsoon", description: "High fungal rot & transport disruption", icon: "🌧️" },
  { key: "DROUGHT_LOW_RAINFALL", name: "Drought / Water Stress", description: "Yield loss on high-water crops", icon: "☀️" },
  { key: "MARKET_SURPLUS", name: "Market Supply Glut", description: "Bumper harvest depresses prices by 25%", icon: "📦" },
  { key: "MARKET_SHORTAGE", name: "Regional Shortage", description: "High buyer demand drives prices up 30%", icon: "📈" },
  { key: "HIGH_TRANSPORT_COST", name: "Fuel Freight Shock", description: "Freight increases to ₹35/km", icon: "⛽" },
];

export default function CropPlanningPage() {
  const [region, setRegion] = useState("Ranchi");
  const [landArea, setLandArea] = useState("5.0");
  const [season, setSeason] = useState("Rabi");
  const [irrigation, setIrrigation] = useState(true);
  const [distanceKm, setDistanceKm] = useState("25");
  const [selectedScenario, setSelectedScenario] = useState("NORMAL");
  const [soilType, setSoilType] = useState("Loamy Red Soil");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropRecommendationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"ranked" | "diversification" | "explainability">("ranked");

  // Fetch initial recommendation on mount
  useEffect(() => {
    handleAnalyze();
  }, []);

  const handleAnalyze = async (scenarioOverride?: string) => {
    setLoading(true);
    setError(null);
    const activeScenario = scenarioOverride || selectedScenario;

    try {
      const payload = {
        region,
        land_area_acres: parseFloat(landArea) || 5.0,
        season,
        irrigation,
        distance_to_market_km: parseFloat(distanceKm) || 25.0,
        soil_type: soilType || undefined,
        scenario: activeScenario,
      };

      const data = await aiApiRequest<CropRecommendationResponse>(
        "/crop-recommendation",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate crop recommendation.");
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioSelect = (scenarioKey: string) => {
    setSelectedScenario(scenarioKey);
    handleAnalyze(scenarioKey);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("en-IN").format(Math.round(val));

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20 font-sans text-stone-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-leaf-900 transition hover:opacity-80"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-700 text-lg text-white shadow-sm">
                🌱
              </span>
              <span>KisanFlow</span>
            </Link>
            <span className="hidden rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 sm:inline-block">
              Jharkhand Pilot
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/price-intelligence"
              className="text-stone-600 transition hover:text-leaf-800"
            >
              Price Intelligence
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-stone-100 px-3 py-1.5 text-stone-700 transition hover:bg-stone-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-stone-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span>✨ Decision Support System</span>
            <span className="text-emerald-400">•</span>
            <span>XGBoost Demand + Price Models</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            What Should We Grow?
          </h1>
          <p className="mt-2 max-w-3xl text-base text-stone-600 sm:text-lg">
            AI-assisted crop planning based on expected demand, regional XGBoost price
            forecasts, exact transport & holding costs, and perishability risk.
          </p>

          {/* Prototype Disclaimer Banner */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900">
            <span className="text-base">⚠️</span>
            <div>
              <span className="font-semibold">Pilot Geography: Jharkhand, India.</span>{" "}
              This is a decision-support advisory system, not a guarantee of crop profit or yields.
              Agronomic parameters use prototype baseline estimates calibrated for Jharkhand agro-climatic conditions.
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Farmer Inputs Form */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-stone-900">Farmer & Land Profile</h2>
              <p className="mt-1 text-xs text-stone-500">
                Provide your farm details to evaluate expected net returns across candidate crops.
              </p>

              <div className="mt-5 space-y-4">
                {/* Region */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Pilot Region (Jharkhand Mandi)
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:border-leaf-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
                  >
                    {JHARKHAND_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r} Mandi
                      </option>
                    ))}
                  </select>
                </div>

                {/* Land Area */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Land Area (Acres)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:border-leaf-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-stone-400">
                      acres
                    </span>
                  </div>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Upcoming Cultivation Season
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {SEASONS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSeason(s)}
                        className={`rounded-xl border py-2 text-xs font-bold transition ${
                          season === s
                            ? "border-leaf-700 bg-leaf-50 text-leaf-900"
                            : "border-stone-200 bg-stone-50/50 text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Irrigation Toggle */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Irrigation Availability
                  </label>
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 p-3">
                    <div className="text-xs">
                      <p className="font-semibold text-stone-800">
                        {irrigation ? "Assured Tube Well / Canal" : "Rainfed / Dryland Only"}
                      </p>
                      <p className="text-stone-500">
                        {irrigation ? "Optimal yield potential" : "-20% to -35% water stress penalty"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIrrigation(!irrigation)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        irrigation ? "bg-leaf-700" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          irrigation ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Optional Distance */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Distance to Regional Mandi (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:border-leaf-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
                  />
                </div>

                {/* Optional Soil Classification */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Soil Classification (Optional)
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:border-leaf-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
                  >
                    <option value="Loamy Red Soil">Loamy Red Soil (Chotanagpur)</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clayey Loam">Clayey Loam</option>
                    <option value="Laterite Soil">Laterite Soil</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf-700 py-3 text-sm font-bold text-white shadow transition hover:bg-leaf-800 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Evaluating Economics...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Analyze Crops</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Interactive Scenarios */}
          <div className="space-y-8 lg:col-span-8">
            {/* Scenario Stress-Testing Selector ("What If?") */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Scenario Stress-Testing ("What If?")
                  </h3>
                  <p className="text-xs text-stone-500">
                    Stress-test farmer crop viability under climate shocks, price crashes, or market gluts.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">
                  Active: {SCENARIOS_LIST.find((s) => s.key === selectedScenario)?.name}
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                {SCENARIOS_LIST.map((sc) => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={() => handleScenarioSelect(sc.key)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                      selectedScenario === sc.key
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-600"
                        : "border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <span className="text-xl">{sc.icon}</span>
                    <span className="mt-1 text-[11px] font-bold leading-tight line-clamp-1">
                      {sc.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && result.top_crop && (
              <>
                {/* 🥇 WINNER HERO CARD */}
                <div className="overflow-hidden rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-950 via-leaf-950 to-stone-900 p-6 text-white shadow-xl sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-lg shadow-sm">
                        🥇
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                        Top Recommendation • {result.season} Season
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                        Score {result.top_crop.score} / 100
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                        {result.top_crop.suitability}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        {result.top_crop.display_name} ({result.top_crop.crop})
                      </h2>
                      <p className="mt-1 text-sm text-emerald-200/90">
                        Best risk-adjusted net return in {result.region} Mandi after all cultivation, transit & spoilage costs.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium text-emerald-300/80">Expected Total Net Return</p>
                      <p className="text-3xl font-black tracking-tight text-amber-300">
                        {formatCurrency(result.top_crop.expected_net_return)}
                      </p>
                      <p className="text-xs text-emerald-200">
                        ~{formatCurrency(result.top_crop.net_return_per_acre)} / acre ({landArea} acres)
                      </p>
                    </div>
                  </div>

                  {/* Winner Key Stats Grid */}
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold text-emerald-200/80">Predicted Price</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        ₹{result.top_crop.predicted_price.toFixed(1)}/kg
                      </p>
                      <p className="text-[10px] text-emerald-300/70">
                        Range: ₹{result.top_crop.price_lower_bound.toFixed(1)} - ₹{result.top_crop.price_upper_bound.toFixed(1)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold text-emerald-200/80">Regional Demand</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {formatNumber(result.top_crop.expected_regional_demand_kg)} kg
                      </p>
                      <p className="text-[10px] text-emerald-300/70">
                        {result.top_crop.market_condition.split("(")[0]}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold text-emerald-200/80">Perishability & Loss</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {result.top_crop.perishability_tier} Risk
                      </p>
                      <p className="text-[10px] text-emerald-300/70">
                        Shelf Life: {result.top_crop.shelf_life_days} days
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold text-emerald-200/80">Benefit-Cost Ratio</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {result.top_crop.benefit_cost_ratio.toFixed(2)}x BCR
                      </p>
                      <p className="text-[10px] text-emerald-300/70">
                        Total Yield: {formatNumber(result.top_crop.total_yield_kg)} kg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-stone-200 text-sm font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ranked")}
                    className={`border-b-2 px-5 py-3 transition ${
                      activeTab === "ranked"
                        ? "border-leaf-700 text-leaf-900"
                        : "border-transparent text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Ranked Crop Comparison ({result.recommendations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("diversification")}
                    className={`border-b-2 px-5 py-3 transition ${
                      activeTab === "diversification"
                        ? "border-leaf-700 text-leaf-900"
                        : "border-transparent text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Diversification Portfolio ({landArea} Acres)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("explainability")}
                    className={`border-b-2 px-5 py-3 transition ${
                      activeTab === "explainability"
                        ? "border-leaf-700 text-leaf-900"
                        : "border-transparent text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Explainability ("Why X? Why not Y?")
                  </button>
                </div>

                {/* TAB 1: RANKED COMPARISON TABLE */}
                {activeTab === "ranked" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
                      <table className="w-full text-left text-sm text-stone-700">
                        <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-500">
                          <tr>
                            <th className="px-4 py-3.5">Rank</th>
                            <th className="px-4 py-3.5">Crop</th>
                            <th className="px-4 py-3.5">Price</th>
                            <th className="px-4 py-3.5">Yield/Acre</th>
                            <th className="px-4 py-3.5">Gross Rev</th>
                            <th className="px-4 py-3.5">Total Costs</th>
                            <th className="px-4 py-3.5 text-emerald-800">Exp. Net Return</th>
                            <th className="px-4 py-3.5">Risk</th>
                            <th className="px-4 py-3.5 text-right">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {result.recommendations.map((rec) => {
                            const totalCosts =
                              rec.production_cost +
                              rec.transport_cost +
                              rec.holding_cost +
                              rec.expected_wastage_cost;
                            const isTop = rec.rank === 1;

                            return (
                              <tr
                                key={rec.crop}
                                className={`transition hover:bg-stone-50/80 ${
                                  isTop ? "bg-emerald-50/40 font-semibold" : ""
                                }`}
                              >
                                <td className="px-4 py-3.5 font-bold">
                                  {isTop ? (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs text-stone-900">
                                      1
                                    </span>
                                  ) : (
                                    <span className="text-stone-500">#{rec.rank}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div>
                                    <span className="font-bold text-stone-900">{rec.crop}</span>
                                    {!rec.is_seasonally_suited && (
                                      <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                        Off-Season
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-stone-400">
                                    {rec.category} • {rec.shelf_life_days}d shelf life
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 font-medium">
                                  ₹{rec.predicted_price.toFixed(1)}
                                  <span className="block text-[10px] text-stone-400">
                                    ±{rec.price_volatility_pct.toFixed(0)}%
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  {formatNumber(rec.expected_yield_kg_per_acre)} kg
                                </td>
                                <td className="px-4 py-3.5">
                                  {formatCurrency(rec.expected_revenue)}
                                </td>
                                <td className="px-4 py-3.5 text-xs text-stone-500">
                                  {formatCurrency(totalCosts)}
                                  <span className="block text-[10px] text-stone-400">
                                    Freight: {formatCurrency(rec.transport_cost)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 font-bold text-emerald-700">
                                  {formatCurrency(rec.expected_net_return)}
                                  <span className="block text-[11px] font-normal text-stone-500">
                                    {formatCurrency(rec.net_return_per_acre)}/ac
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                      rec.risk_level === "LOW"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : rec.risk_level === "MEDIUM"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {rec.risk_level}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-extrabold text-stone-900">
                                  {rec.score.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-100 p-3 text-xs text-stone-600">
                      <span>
                        Decision Weights: Return (40%) • Demand (20%) • Price Stability (15%) • Wastage Safety (10%) • Transport (10%) • Agronomic (5%)
                      </span>
                      <span className="font-semibold text-leaf-800">
                        Pilot Mandi: {result.region}
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 2: DIVERSIFICATION PORTFOLIO */}
                {activeTab === "diversification" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-stone-900">
                            Recommended Land Allocation ({result.diversification_plan.total_acres} Acres)
                          </h3>
                          <p className="mt-1 text-xs text-stone-500">
                            {result.diversification_plan.strategy}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-stone-500">Combined Portfolio Return</p>
                          <p className="text-2xl font-black text-emerald-700">
                            {formatCurrency(result.diversification_plan.portfolio_net_return)}
                          </p>
                          <p className="text-xs text-stone-400">
                            ~{formatCurrency(result.diversification_plan.blended_net_return_per_acre)}/acre
                          </p>
                        </div>
                      </div>

                      {/* Acreage Visual Split Bar */}
                      <div className="mt-6 flex h-4 w-full overflow-hidden rounded-full bg-stone-100">
                        {result.diversification_plan.allocations.map((alloc, idx) => {
                          const colors = ["bg-emerald-600", "bg-amber-500", "bg-blue-500", "bg-purple-500"];
                          return (
                            <div
                              key={alloc.crop}
                              style={{ width: `${alloc.fraction_pct}%` }}
                              className={`${colors[idx % colors.length]} transition-all`}
                              title={`${alloc.crop}: ${alloc.acres} acres (${alloc.fraction_pct}%)`}
                            />
                          );
                        })}
                      </div>

                      {/* Allocation Cards */}
                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {result.diversification_plan.allocations.map((alloc, idx) => (
                          <div
                            key={alloc.crop}
                            className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 transition hover:bg-white hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-stone-900">{alloc.crop}</span>
                              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                                {alloc.fraction_pct}%
                              </span>
                            </div>
                            <p className="mt-1 text-2xl font-black text-stone-900">
                              {alloc.acres} <span className="text-xs font-normal text-stone-500">acres</span>
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-stone-600">
                              <div className="flex justify-between">
                                <span>Exp. Yield:</span>
                                <span className="font-semibold">{formatNumber(alloc.expected_yield_kg)} kg</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Gross Rev:</span>
                                <span className="font-semibold">{formatCurrency(alloc.expected_revenue)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-800">
                                <span>Net Return:</span>
                                <span>{formatCurrency(alloc.expected_net_return)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900">
                        <span className="font-bold">Portfolio Rationale:</span>{" "}
                        {result.diversification_plan.rationale}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: EXPLAINABILITY */}
                {activeTab === "explainability" && (
                  <div className="space-y-6">
                    {/* Why Top Crop */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <h3 className="text-base font-bold text-emerald-950">
                          Why {result.top_crop.crop}?
                        </h3>
                      </div>
                      <ul className="mt-4 space-y-2.5 text-sm text-emerald-900">
                        {result.explainability.why_top_crop.map((point, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-0.5 font-bold text-emerald-600">✓</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Why Not Alternatives */}
                    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚖️</span>
                        <h3 className="text-base font-bold text-stone-900">
                          Why not higher nominal price alternatives?
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        Farmers often plant crops with high nominal price peaks (like Tomato or Chilli), but suffer devastating losses when prices crash or produce rots in transit.
                      </p>

                      <div className="mt-4 space-y-3">
                        {result.explainability.why_not_alternatives.map((alt) => (
                          <div
                            key={alt.crop}
                            className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 text-sm text-stone-800"
                          >
                            <span className="font-bold text-stone-900">{alt.crop}</span>{" "}
                            <span className="text-xs text-stone-500">(Rank #{alt.rank})</span>:{" "}
                            {alt.explanation}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
