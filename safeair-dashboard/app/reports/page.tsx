import { DashboardLayout } from "../components/DashboardLayout";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardLayout>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 text-sm text-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <h2 className="mb-2 text-lg sm:text-xl font-semibold">Reports</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            This page is ready for your SafeAirTrack CO₂ reports (daily,
            weekly, per-site summaries). You can plug your backend data here.
          </p>
        </section>
      </DashboardLayout>
    </div>
  );
}


