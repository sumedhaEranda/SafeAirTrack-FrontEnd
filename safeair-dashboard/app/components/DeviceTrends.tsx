"use client";

import { useEffect, useState } from "react";

type HourlyPpmPoint = {
  time: string;
  ppmValue: number;
  isPeak: boolean;
  hour: number;
};

type DeviceLocation = {
  id: string;
  name: string;
  deviceUid: string;
  status: string;
  alertLevel: string;
  latitude: number | null;
  longitude: number | null;
  hourlyPpmData: HourlyPpmPoint[];
};

type DashboardTrendResponse = {
  currentDaySelected: string;
  availableDays: string[];
  deviceLocationsData: DeviceLocation[];
};

function getMaxPpm(points: HourlyPpmPoint[]): number {
  return points.reduce((max, p) => (p.ppmValue > max ? p.ppmValue : max), 0);
}

function getBarHeight(ppm: number, maxPpm: number): number {
  if (maxPpm <= 0) return 8;
  const ratio = ppm / maxPpm;
  return 8 + ratio * 70; // 8–78%
}

export function DeviceTrends() {
  const [day, setDay] = useState<string>("Monday");
  const [mode, setMode] = useState<"weekly" | "range">("weekly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [data, setData] = useState<DashboardTrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";
    if (!baseUrl) {
      setError("LIVE_URL not configured");
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();

    // Mutually exclusive: either weekly/day OR date range
    if (mode === "weekly") {
      // Weekly/Day mode: only send day parameter
      params.set("day", day);
    } else if (mode === "range" && startDate && endDate) {
      // Date range mode: only send startDate and endDate, NOT day
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    } else if (mode === "range") {
      // Don't fetch if range mode but dates not filled
      setLoading(false);
      return;
    }

    fetch(`${baseUrl}/api/dashboard/device-locations?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((json: DashboardTrendResponse) => {
        setData(json);
      })
      .catch((err) => {
        console.error("Error fetching device trends", err);
        setError("Unable to load device trends");
      })
      .finally(() => setLoading(false));
  }, [day, mode, startDate, endDate]);

  const availableDays = (data?.availableDays ?? [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]).filter((d) => d !== "Today");

  // Ensure day is valid (not "Today") when availableDays changes
  useEffect(() => {
    if (day === "Today" || !availableDays.includes(day)) {
      setDay(availableDays[0] || "Monday");
    }
  }, [availableDays, day]);

  const allDevices = data?.deviceLocationsData ?? [];
  
  // Filter devices based on search query
  const devices = allDevices.filter((device) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      device.name.toLowerCase().includes(query) ||
      device.deviceUid.toLowerCase().includes(query) ||
      device.id.toLowerCase().includes(query)
    );
  });

  return (
    <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 text-xs text-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-sm font-medium text-slate-100">
            CO₂ Trend by Device
          </h2>
          <p className="text-[11px] text-slate-400">
            Select a day or a date range to inspect hourly CO₂ ppm for each sensor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto flex-1 min-w-[150px] rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "weekly" | "range")}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="weekly">Weekly/Day</option>
            <option value="range">Date Range</option>
          </select>

          {mode === "weekly" && (
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {availableDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {mode === "range" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1 text-[11px] text-slate-400 w-full sm:w-auto">
              <div className="flex items-center gap-1 flex-1 sm:flex-initial">
                <span>From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div className="flex items-center gap-1 flex-1 sm:flex-initial">
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-[11px] text-slate-400">Loading device trends…</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-300">
          {error}. Check your API and env config.
        </p>
      )}

      {!loading && !error && allDevices.length === 0 && (
        <p className="text-[11px] text-slate-400">
          No device trend data available.
        </p>
      )}

      {!loading && !error && allDevices.length > 0 && devices.length === 0 && (
        <p className="text-[11px] text-slate-400">
          No devices found matching "{searchQuery}". Try a different search term.
        </p>
      )}

      {!loading && !error && devices.length > 0 && (
        <p className="mb-2 text-[11px] text-slate-400">
          Showing {devices.length} of {allDevices.length} device{allDevices.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const maxPpm = getMaxPpm(device.hourlyPpmData);
          return (
            <div
              key={device.id}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    {device.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    UID: {device.deviceUid}
                  </p>
                </div>
                <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300">
                  {device.status}
                </span>
              </div>

              <div className="mb-2 flex h-24 items-end gap-[3px] rounded-xl bg-slate-900/70 px-2 pb-2 pt-3 ring-1 ring-slate-800">
                {device.hourlyPpmData.map((point) => (
                  <div
                    key={point.hour}
                    className="flex-1 rounded-full bg-gradient-to-t from-emerald-500/10 via-emerald-500/40 to-emerald-400/80"
                    style={{
                      height: `${getBarHeight(point.ppmValue, maxPpm)}%`,
                    }}
                    title={`${point.time} — ${point.ppmValue} ppm`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  Max:{" "}
                  <span className="text-slate-200">
                    {maxPpm ? Math.round(maxPpm) : 0} ppm
                  </span>
                </span>
                <span>
                  {mode === "weekly"
                    ? day
                    : startDate && endDate
                      ? `${startDate} to ${endDate}`
                      : "Select dates"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


