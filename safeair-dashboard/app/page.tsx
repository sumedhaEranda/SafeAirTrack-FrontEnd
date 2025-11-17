import { CO2StatsRow } from "./components/CO2StatsRow";
import { RealtimeCO2Panel } from "./components/RealtimeCO2Panel";
import { LocationsTable } from "./components/LocationsTable";
import { DashboardLayout } from "./components/DashboardLayout";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardLayout>
        <CO2StatsRow />
        <RealtimeCO2Panel />
        <LocationsTable />

        <footer className="flex flex-col gap-1 pb-2 pt-1 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SafeAirTrack. Monitoring CO₂ in
            realtime with precise GPS.
          </p>
          <p className="text-slate-500">
            Data simulated for demo. Connect your devices backend for live
            values.
          </p>
        </footer>
      </DashboardLayout>
    </div>
  );
}

