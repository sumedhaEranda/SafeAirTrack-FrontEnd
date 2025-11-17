import {
  LocationsTable,
  type DeviceSummary,
} from "../components/LocationsTable";
import { DashboardLayout } from "../components/DashboardLayout";
import { DeviceTrends } from "../components/DeviceTrends";

async function fetchDeviceSummaries(): Promise<DeviceSummary[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";

  if (!baseUrl) {
    return [];
  }

  const res = await fetch(`${baseUrl}/api/devices/summary`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch device summaries", res.statusText);
    return [];
  }

  return res.json();
}

export default async function DevicesPage() {
  const devices = await fetchDeviceSummaries();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardLayout>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-100">
              Devices & GPS Locations
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              View all registered devices and their CO₂ monitoring data
            </p>
          </div>
          <a
            href="/devices/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            <span>+</span>
            Register Device
          </a>
        </div>
        <LocationsTable devices={devices} />
        <DeviceTrends />
      </DashboardLayout>
    </div>
  );
}

