type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="card p-5">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-leaf-600">{detail}</p>
    </article>
  );
}
