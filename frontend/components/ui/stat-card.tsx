type StatCardProps = { label: string; value: string; detail: string; icon: string };

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return <article className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft"><div className="mb-5 flex items-start justify-between"><span className="text-2xl" aria-hidden>{icon}</span><span className="rounded-full bg-leaf-50 px-2 py-1 text-xs font-medium text-leaf-700">Live</span></div><p className="text-sm text-stone-500">{label}</p><p className="mt-1 text-2xl font-semibold text-stone-900">{value}</p><p className="mt-2 text-xs text-leaf-600">{detail}</p></article>;
}
