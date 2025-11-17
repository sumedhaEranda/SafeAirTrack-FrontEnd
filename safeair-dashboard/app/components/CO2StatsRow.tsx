type StatCardProps = {
  label: string;
  value: string;
  unit: string;
  trend: string;
  badge: string;
  badgeColor: string;
  tone: string;
};

export function CO2StatsRow() {
  return (
    <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Average CO₂"
        value="742"
        unit="ppm"
        trend="+58 ppm vs 1h ago"
        badge="Comfort range"
        badgeColor="bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
        tone="from-emerald-500/15 via-slate-900 to-slate-950"
      />
      <StatCard
        label="Max CO₂ today"
        value="1,132"
        unit="ppm"
        trend="Recorded at Industrial Plant"
        badge="Peak exposure"
        badgeColor="bg-amber-500/15 text-amber-300 ring-amber-400/40"
        tone="from-amber-500/15 via-slate-900 to-slate-950"
      />
      <StatCard
        label="Devices Online"
        value="12"
        unit="sensors"
        trend="100% of network"
        badge="All reporting"
        badgeColor="bg-sky-500/15 text-sky-300 ring-sky-400/40"
        tone="from-sky-500/15 via-slate-900 to-slate-950"
      />
      <StatCard
        label="Locations Exceeding"
        value="3"
        unit="sites"
        trend="Above 1000 ppm"
        badge="Attention"
        badgeColor="bg-rose-500/15 text-rose-300 ring-rose-400/40"
        tone="from-rose-500/15 via-slate-900 to-slate-950"
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  unit,
  trend,
  badge,
  badgeColor,
  tone,
}: StatCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${tone} px-4 pb-4 pt-3`}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-300">{label}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-2xl font-semibold tracking-tight text-slate-50">
                {value}
              </p>
              <p className="text-[11px] text-slate-300">{unit}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ring-1 ${badgeColor}`}
          >
            {badge}
          </span>
        </div>
        <p className="text-[11px] text-slate-300">{trend}</p>
      </div>
    </div>
  );
}


