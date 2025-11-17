export type DeviceSummary = {
  id: number;
  deviceUid: string;
  registeredAt: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  latestCo2: number | null;
  latestRecordedAt: string | null;
};

type Status = "normal" | "elevated" | "high" | "no-data";

export function LocationsTable({ devices = [] }: { devices?: DeviceSummary[] }) {
  return (
    <section className="mb-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-100">
            CO₂ & GPS Locations
          </h2>
          <p className="text-xs text-slate-400">
            Each row represents a device with coordinates and latest CO₂ ppm.
          </p>
        </div>
        <button className="w-full sm:w-auto rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-800/80">
          View on map
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60">
        <table className="min-w-full border-separate border-spacing-0 text-xs">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Device UID</th>
              <th className="px-3 py-2 text-left font-medium">CO₂ (ppm)</th>
              <th className="px-3 py-2 text-left font-medium">Latitude</th>
              <th className="px-3 py-2 text-left font-medium">Longitude</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const status = getStatus(device.latestCo2);

              const lat =
                device.location?.latitude !== undefined
                  ? device.location.latitude.toFixed(6)
                  : "-";
              const lng =
                device.location?.longitude !== undefined
                  ? device.location.longitude.toFixed(6)
                  : "-";

              const updated =
                device.latestRecordedAt != null
                  ? new Date(device.latestRecordedAt).toLocaleString()
                  : "No data yet";

              return (
                <tr
                  key={device.id}
                  className="border-t border-slate-800/80 text-slate-200"
                >
                  <td className="px-3 py-2 align-top text-xs">
                    {device.deviceUid}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-100">
                    {device.latestCo2 != null ? device.latestCo2 : "-"}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-300">
                    {lat}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-300">
                    {lng}
                  </td>
                  <td className="px-3 py-2 align-top text-xs">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-400">
                    {updated}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {devices.map((device) => {
          const status = getStatus(device.latestCo2);

          const lat =
            device.location?.latitude !== undefined
              ? device.location.latitude.toFixed(6)
              : "-";
          const lng =
            device.location?.longitude !== undefined
              ? device.location.longitude.toFixed(6)
              : "-";

          const updated =
            device.latestRecordedAt != null
              ? new Date(device.latestRecordedAt).toLocaleString()
              : "No data yet";

          return (
            <div
              key={device.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    {device.deviceUid}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-100 font-medium">
                      CO₂: {device.latestCo2 != null ? device.latestCo2 : "-"} ppm
                    </span>
                    <StatusBadge status={status} />
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="text-slate-200 font-mono">{lat}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="text-slate-200 font-mono">{lng}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Updated:</span>
                  <span className="text-slate-300 text-[10px]">{updated}</span>
                </div>
              </div>
            </div>
          );
        })}
        {devices.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            No devices found
          </p>
        )}
      </div>
    </section>
  );
}

function getStatus(co2: number | null): Status {
  if (co2 == null) return "no-data";
  if (co2 < 800) return "normal";
  if (co2 < 1000) return "elevated";
  return "high";
}

function StatusBadge({ status }: { status: Status }) {
  const styles =
    status === "normal"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
      : status === "elevated"
        ? "bg-amber-500/15 text-amber-300 ring-amber-400/40"
        : status === "high"
          ? "bg-rose-500/15 text-rose-300 ring-rose-400/40"
          : "bg-slate-500/15 text-slate-300 ring-slate-400/40";

  const label =
    status === "normal"
      ? "Normal"
      : status === "elevated"
        ? "Elevated"
        : status === "high"
          ? "High"
          : "No data";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ring-1 ${styles}`}
    >
      {label}
    </span>
  );
}


