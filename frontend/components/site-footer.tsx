export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-leaf-700 text-xs font-bold text-white">
              K
            </span>
            <span className="font-semibold text-stone-900">KisanFlow</span>
          </div>
          <p className="text-sm text-stone-500">
            Fairer markets. Fresher food. Better livelihoods.
          </p>
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} KisanFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
