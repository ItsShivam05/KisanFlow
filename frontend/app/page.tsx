import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

const stats = [
  { label: "Active growers", value: "2,480", detail: "+12% this month", icon: "" },
  { label: "Produce matched", value: "82 tonnes", detail: "Across 14 crop categories", icon: "" },
  { label: "Delivery routes", value: "36", detail: "Optimized for today", icon: "" },
];

const steps = [
  {
    step: "01",
    title: "List your harvest",
    body: "Farmers and FPOs list available produce with quantity, grade, and asking price.",
  },
  {
    step: "02",
    title: "Match with demand",
    body: "Buyers submit procurement requests. KisanFlow identifies the best available supply combination.",
  },
  {
    step: "03",
    title: "Deliver fresh",
    body: "Orders are confirmed, routes optimized, and deliveries tracked end-to-end.",
  },
];

const forFarmers = [
  "Know what buyers need before you harvest",
  "Get fair pricing based on market signals",
  "Receive orders directly — no middlemen",
  "Track payment and delivery status",
];

const forBuyers = [
  "Source fresh, traceable produce locally",
  "See supply, price, and quality before ordering",
  "Consolidate from multiple farmers in one order",
  "Track deliveries in real time",
];

export default function Home() {
  return (
    <main id="top" className="bg-sand">
      <Navigation />

      {/* ── Hero ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_420px] lg:items-center">
          {/* Copy */}
          <div className="max-w-2xl">
            <p className="eyebrow">The farm-to-market network</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Better value from
              <br />
              every harvest.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
              KisanFlow connects farmers, FPOs, and buyers directly — using smarter
              demand and supply signals to get fresh produce where it needs to go.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/register" className="btn-primary">
                Get started
              </a>
              <a href="#how-it-works" className="btn-secondary">
                How it works
              </a>
            </div>
            <p className="mt-8 text-sm text-stone-400">
              Trusted by farmers, FPOs, restaurants, and retailers across India.
            </p>
          </div>

          {/* Preview card */}
          <div className="card p-6 shadow-lg">
            <div className="rounded-lg bg-leaf-900 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-leaf-300">
                Today's market signal
              </p>
              <p className="mt-2 text-xl font-semibold">Strong demand for onions</p>
              {/* Inline bar chart */}
              <div className="mt-4 flex items-end gap-1.5" aria-label="Demand chart" role="img">
                {[42, 58, 46, 72, 63, 88, 96].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-leaf-500/70 transition-all"
                    style={{ height: `${h / 2.5}px` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-leaf-300">7-day regional demand index</p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Market match found</p>
                  <p className="mt-0.5 text-xs text-stone-500">Pune · 240 kg · Pickup tomorrow</p>
                </div>
                <span className="badge-green tabular-nums text-sm font-semibold">₹28/kg</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Expected demand</p>
                  <p className="mt-0.5 text-xs text-stone-500">Next 3 days</p>
                </div>
                <span className="text-sm font-semibold text-stone-700">12,400 kg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────── */}
      <section id="for-farmers" className="border-y border-stone-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Network overview</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                Make confident decisions, from farm to buyer.
              </h2>
            </div>
            <a className="text-sm font-semibold text-leaf-700 hover:text-leaf-900" href="#how-it-works">
              See how it works →
            </a>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── For Farmers / Buyers ──────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Farmers */}
          <div className="card p-8">
            <p className="eyebrow">For farmers & FPOs</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
              Know what to grow. Know what you'll earn.
            </h2>
            <ul className="mt-6 space-y-3">
              {forFarmers.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-stone-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href="/register" className="btn-primary">
                Join as a farmer
              </a>
            </div>
          </div>

          {/* Buyers */}
          <div className="card p-8">
            <p className="eyebrow">For buyers & institutions</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
              Source fresh produce with full visibility.
            </h2>
            <ul className="mt-6 space-y-3">
              {forBuyers.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-stone-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-earth-100 text-earth-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href="/register" className="btn-secondary">
                Join as a buyer
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────── */}
      <section id="how-it-works" className="border-t border-stone-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Less waste, more opportunity</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              Fresh produce should not get lost in the middle.
            </h2>
            <p className="mt-4 text-stone-600 leading-relaxed">
              From demand visibility to route optimization, KisanFlow keeps the whole
              journey transparent and moving.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-leaf-200">
                <span className="text-xs font-bold text-leaf-600">{s.step}</span>
                <h3 className="mt-2 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section id="for-buyers" className="border-t border-stone-200 bg-leaf-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow !text-leaf-300">Ready to get started</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Bring more value to every link in the food chain.
              </h2>
            </div>
            <a
              href="/register"
              className="shrink-0 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-leaf-900 shadow-sm transition hover:bg-leaf-50"
            >
              Get started today
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
