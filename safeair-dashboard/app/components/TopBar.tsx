export function TopBar() {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          CO₂ Realtime Overview
        </h1>
        <p className="text-xs text-slate-400 md:text-sm">
          Live CO₂ concentration and GPS locations from all active devices.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="w-full sm:w-auto rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 text-center sm:text-left">
          Live • last 5 minutes window
        </div>
        <button className="flex-1 sm:flex-initial rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800/80">
          Export CO₂ data
        </button>
        <button className="flex-1 sm:flex-initial rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400">
          + Add device
        </button>
      </div>
    </header>
  );
}


