"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeviceSummary } from "./LocationsTable";

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

type Props = {
  devices: DeviceSummary[];
};

const FALLBACK_DAYS = [
  "Today",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DeviceTrendPanel({ devices }: Props) {
  const [selectedDeviceUid, setSelectedDeviceUid] = useState<string | null>(
    devices[0]?.deviceUid ?? null,
  );
  const [selectedDay, setSelectedDay] = useState<string>("Today");
  const [trendData, setTrendData] = useState<DashboardTrendResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";

  useEffect(() => {
    if (!baseUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `${baseUrl}/api/dashboard/device-locations?day=${encodeURIComponent(
        selectedDay,
      )}`,
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then((data: DashboardTrendResponse) => {
        if (!cancelled) {
          setTrendData(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Error loading device trend", err);
          setError("Unable to load trend data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, selectedDay]);

  const availableDays =
    trendData?.availableDays && trendData.availableDays.length > 0
      ? trendData.availableDays
      : FALLBACK_DAYS;

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceUid || !trendData) return null;
    return trendData.deviceLocationsData.find(
      (d) => d.deviceUid === selectedDeviceUid,
    );
  }, [selectedDeviceUid, trendData]);

  const maxPpm = useMemo(() => {
    if (!selectedDevice) return 0;
    return selectedDevice.hourlyPpmData.reduce(
      (max, p) => (p.ppmValue > max ? p.ppmValue : max),
      0,
    );
  }, [selectedDevice]);

  const getBarHeight = (ppm: number): number => {
    if (maxPpm <= 0) return 10;
    const ratio = ppm / maxPpm;
    return 10 + ratio * 80; // between 10% and 90%
  };

  return (
    <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-100">
            Device CO₂ Trend
          </h2>
          <p className="text-xs text-slate-400">
            Select a device and day to view hourly CO₂ ppm.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-100"
            value={selectedDeviceUid ?? ""}
            onChange={(e) => setSelectedDeviceUid(e.target.value || null)}
          >
            {devices.map((d) => (
              <option key={d.deviceUid} value={d.deviceUid}>
                {d.deviceUid}
              </option>
            ))}
          </select>
          <select
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-100"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {availableDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-[11px] text-slate-400">Loading trend data…</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-300">
          {error} Please check your backend.
        </p>
      )}

      {!loading && !error && selectedDevice && (
        <>
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {selectedDevice.name} • {trendData?.currentDaySelected ?? "Today"}
            </span>
            {maxPpm > 0 && (
              <span>
                Max:{" "}
                <span className="text-amber-200">
                  {Math.round(maxPpm)} ppm
                </span>
              </span>
            )}
          </div>

          <div className="flex h-48 items-end gap-1.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 px-3 pb-3 pt-4 ring-1 ring-slate-800">
            {selectedDevice.hourlyPpmData.map((point) => (
              <div
                key={point.hour}
                className="flex-1 rounded-full bg-gradient-to-t from-emerald-500/10 via-emerald-500/40 to-emerald-400/80"
                style={{ height: `${getBarHeight(point.ppmValue)}%` }}
                title={`${point.time} — ${point.ppmValue} ppm`}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <p>Hourly ppm, based on backend trend data.</p>
            <p>Lower values indicate better air quality.</p>
          </div>
        </>
      )}

      {!loading && !error && !selectedDevice && (
        <p className="text-[11px] text-slate-400">
          No trend data available for the selected device / day.
        </p>
      )}
    </section>
  );
}


