"use client";

import { useEffect, useState } from "react";

type DeviceSummary = {
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

function getStatus(co2: number | null): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (co2 == null) {
    return {
      label: "No data",
      color: "text-slate-300",
      bgColor: "bg-slate-500/15 text-slate-300 ring-slate-400/40",
    };
  }
  if (co2 < 800) {
    return {
      label: "Normal",
      color: "text-emerald-300",
      bgColor: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40",
    };
  }
  if (co2 < 1000) {
    return {
      label: "Elevated",
      color: "text-amber-300",
      bgColor: "bg-amber-500/15 text-amber-300 ring-amber-400/40",
    };
  }
  return {
    label: "High",
    color: "text-rose-300",
    bgColor: "bg-rose-500/15 text-rose-300 ring-rose-400/40",
  };
}

function formatTime(dateString: string | null): string {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString();
  } catch {
    return "Invalid date";
  }
}

// Client-only time display to avoid hydration mismatch
function TimeDisplay({ date }: { date: Date }) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    setTime(date.toLocaleTimeString());
    const interval = setInterval(() => {
      setTime(date.toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  return <span suppressHydrationWarning>{time || "--:--:--"}</span>;
}

export function LiveDevicesPanel() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDevices = async () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";

    if (!baseUrl) {
      setError("LIVE_URL not configured");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/devices/summary`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }

      const data = (await res.json()) as DeviceSummary[];
      setDevices(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching live devices", err);
      setError("Unable to load live device data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  const devicesWithData = devices.filter((d) => d.latestCo2 != null);
  const devicesWithoutData = devices.filter((d) => d.latestCo2 == null);

  const avgCo2 =
    devicesWithData.length > 0
      ? devicesWithData.reduce((sum, d) => sum + (d.latestCo2 ?? 0), 0) /
        devicesWithData.length
      : 0;

  const maxCo2 =
    devicesWithData.length > 0
      ? Math.max(...devicesWithData.map((d) => d.latestCo2 ?? 0))
      : 0;

  return (
    <section className="mb-6 space-y-4">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <p className="text-xs font-medium text-slate-300">Total Devices</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">
            {devices.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {devicesWithData.length} reporting data
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <p className="text-xs font-medium text-slate-300">Average CO₂</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">
            {avgCo2 > 0 ? Math.round(avgCo2) : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">ppm across devices</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <p className="text-xs font-medium text-slate-300">Max CO₂</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">
            {maxCo2 > 0 ? Math.round(maxCo2) : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">ppm peak reading</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <p className="text-xs font-medium text-slate-300">Last Updated</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-50">
            <TimeDisplay date={lastUpdated} />
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Auto-refresh: 3s</p>
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Live devices list */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-100">
              Live CO₂ Readings
            </h2>
            <p className="text-xs text-slate-400">
              Real-time CO₂ concentration from all active devices.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 ring-1 ring-emerald-400/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        {loading && (
          <p className="text-[11px] text-slate-400">Loading devices…</p>
        )}

        {error && (
          <p className="text-[11px] text-rose-300">
            {error}. Check your API and env config.
          </p>
        )}

        {!loading && !error && devices.length === 0 && (
          <p className="text-[11px] text-slate-400">
            No devices found. Check your API connection.
          </p>
        )}

        <div className="space-y-2">
          {devicesWithData.map((device) => {
            const status = getStatus(device.latestCo2);
            return (
              <div
                key={device.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-slate-950/60 px-3 py-2.5 ring-1 ring-slate-800/80"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-100">
                      {device.deviceUid}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${status.bgColor}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  {device.location && (
                    <p className="mt-1 text-[11px] text-slate-400 break-all">
                      📍 {device.location.latitude.toFixed(6)},{" "}
                      {device.location.longitude.toFixed(6)}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Updated: {formatTime(device.latestRecordedAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-lg font-semibold text-slate-100">
                    {device.latestCo2 != null
                      ? Math.round(device.latestCo2)
                      : "-"}
                  </p>
                  <p className="text-[10px] text-slate-400">ppm</p>
                </div>
              </div>
            );
          })}

          {devicesWithoutData.length > 0 && (
            <div className="mt-4 border-t border-slate-800 pt-3">
              <p className="mb-2 text-[11px] font-medium text-slate-400">
                Devices without data ({devicesWithoutData.length})
              </p>
              <div className="space-y-1.5">
                {devicesWithoutData.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-1.5"
                  >
                    <p className="text-[11px] text-slate-500">
                      {device.deviceUid}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      No readings yet
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}

