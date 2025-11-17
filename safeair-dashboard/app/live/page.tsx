import { DashboardLayout } from "../components/DashboardLayout";
import { LiveDevicesPanel } from "../components/LiveDevicesPanel";

export default function LiveCO2Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardLayout>
        <LiveDevicesPanel />
      </DashboardLayout>
    </div>
  );
}


