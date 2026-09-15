import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Left panel — branding */}
      <section className="hidden flex-col justify-between bg-leaf-900 p-12 text-white lg:flex">
        <a
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
            K
          </span>
          KisanFlow
        </a>

        <div className="max-w-sm">
          <p className="eyebrow !text-leaf-300">From farm to market</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight leading-snug">
            A more connected food economy starts here.
          </h1>
          <p className="mt-5 text-leaf-200 leading-relaxed">
            See demand, find the right buyer, and move every harvest with
            confidence.
          </p>

          {/* Trust signals */}
          <div className="mt-10 space-y-3">
            {[
              "Verified farmers and FPOs",
              "Transparent pricing and allocation",
              "Optimized delivery routes",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-leaf-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf-700 text-leaf-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-leaf-400">
          Fairer markets. Fresher food. Better livelihoods.
        </p>
      </section>

      {/* Right panel — form */}
      <section className="flex items-center justify-center bg-sand px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <a
            href="/"
            className="mb-10 flex items-center gap-2.5 text-lg font-bold text-stone-900 lg:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-700 text-sm font-bold text-white">
              K
            </span>
            KisanFlow
          </a>
          {children}
        </div>
      </section>
    </main>
  );
}
