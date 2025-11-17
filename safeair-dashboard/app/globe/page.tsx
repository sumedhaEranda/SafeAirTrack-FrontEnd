import { DashboardLayout } from "../components/DashboardLayout";
import { Live3DMap } from "../components/Live3DMap";

export default function GlobePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardLayout>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
            Live 3D Google Earth Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactive 3D Google Earth-style map with real-time device locations and CO₂ monitoring. Auto-updates every 3 seconds.
          </p>
        </div>

        <Live3DMap />

        <footer className="flex flex-col gap-1 pb-2 pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SafeAirTrack. Live 3D Earth Globe with
            real-time device locations.
          </p>
          <p className="text-slate-500">
            Rotate and zoom to explore device locations around the world. Data updates automatically.
          </p>
        </footer>
      </DashboardLayout>
    </div>
  );
}

