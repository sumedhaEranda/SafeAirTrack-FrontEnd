type SidebarItemProps = {
  label: string;
  href: string;
  subtle?: boolean;
  isActive?: boolean;
  onLinkClick?: () => void;
};

type SidebarProps = {
  onLinkClick?: () => void;
};

export function Sidebar({ onLinkClick }: SidebarProps) {
  return (
    <aside className="flex w-full flex-shrink-0 flex-col rounded-3xl bg-slate-900/70 p-4 shadow-xl ring-1 ring-slate-800/80 md:w-64">
      <div className="mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/40">
          <span className="text-xl font-semibold text-emerald-300">SA</span>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">SafeAirTrack</p>
          <p className="text-[11px] text-slate-400">
            CO₂ & Location Monitoring
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 text-sm">
        <SidebarItem label="CO₂ Dashboard" href="/" onLinkClick={onLinkClick} />
        <SidebarItem label="Live CO₂ Stream" href="/live" onLinkClick={onLinkClick} />
        <SidebarItem label="3D Earth Globe" href="/globe" onLinkClick={onLinkClick} />
        <SidebarItem label="Devices & GPS" href="/devices" onLinkClick={onLinkClick} />
        <SidebarItem label="Register Device" href="/devices/register" subtle onLinkClick={onLinkClick} />
        <SidebarItem label="Reports" href="/reports" onLinkClick={onLinkClick} />
        <SidebarItem label="Alerts" href="/alerts" onLinkClick={onLinkClick} />

        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            CO₂ Insights
          </p>
          <SidebarItem label="Exposure Hotspots" href="/reports/hotspots" subtle onLinkClick={onLinkClick} />
          <SidebarItem
            label="Outdoor vs Indoor"
            href="/reports/indoor-outdoor"
            subtle
            onLinkClick={onLinkClick}
          />
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-3">
            <p className="mb-1 text-xs font-medium text-emerald-200">
              Network: Online
            </p>
            <p className="text-[11px] text-slate-300">
              All CO₂ sensors are reporting in the last 60 seconds.
            </p>
          </div>
          <button className="flex w-full items-center justify-center rounded-2xl bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700/80">
            Configure CO₂ Thresholds
          </button>
        </div>
      </nav>
    </aside>
  );
}

function SidebarItem({ label, href, subtle, onLinkClick }: SidebarItemProps) {
  return (
    <a href={href} onClick={onLinkClick}>
      <button
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition ${
          subtle
            ? "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            : "text-slate-200 hover:bg-slate-800/80"
        }`}
      >
        <span>{label}</span>
      </button>
    </a>
  );
}

