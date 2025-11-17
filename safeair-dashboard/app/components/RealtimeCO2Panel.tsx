type LiveRowProps = {
  label: string;
  co2: number;
  status: string;
  statusColor: string;
  detail: string;
};

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

async function fetchTrendData(
  day: string = "Today",
): Promise<DashboardTrendResponse | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";

  if (!baseUrl) return null;

  try {
    const res = await fetch(
      `${baseUrl}/api/dashboard/device-locations?day=${encodeURIComponent(day)}`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      console.error("Failed to fetch dashboard trend data", res.statusText);
      return null;
    }

    return (await res.json()) as DashboardTrendResponse;
  } catch (err) {
    console.error("Error fetching dashboard trend data", err);
    return null;
  }
}

function getMaxPpm(points: HourlyPpmPoint[]): number {
  return points.reduce((max, p) => (p.ppmValue > max ? p.ppmValue : max), 0);
}

function getBarHeight(ppm: number, maxPpm: number): number {
  if (maxPpm <= 0) return 10;
  const ratio = ppm / maxPpm;
  return 10 + ratio * 80; // between 10% and 90%
}

export async function RealtimeCO2Panel() {
  const data = await fetchTrendData("Today");
  const firstDevice = data?.deviceLocationsData[0];
  const trendPoints = firstDevice?.hourlyPpmData ?? [];
  const maxPpm = getMaxPpm(trendPoints);

  const liveDevices = (data?.deviceLocationsData ?? []).slice(0, 3);

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-3">
      {/* Trend card */}
      <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-100">
              CO₂ Trend — {data?.currentDaySelected ?? "Today"}
            </h2>
            <p className="text-xs text-slate-400">
              Hourly CO₂ ppm for{" "}
              <span className="text-slate-200">
                {firstDevice?.name ?? "your sensors"}
              </span>
              .
            </p>
          </div>
          {firstDevice && (
            <div className="flex flex-col items-end text-right text-[11px] text-slate-400">
              <span className="text-slate-200">{firstDevice.deviceUid}</span>
              <span>{firstDevice.alertLevel}</span>
            </div>
          )}
        </div>

        {/* CO₂ chart from API */}
        <div className="flex h-52 items-end gap-2 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 px-3 pb-3 pt-4 ring-1 ring-slate-800">
          {trendPoints.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
              No CO₂ data available yet for today.
            </div>
          ) : (
            trendPoints.map((point) => (
              <div
                key={point.hour}
                className="flex-1 rounded-full bg-gradient-to-t from-emerald-500/10 via-emerald-500/40 to-emerald-400/80"
                style={{
                  height: `${getBarHeight(point.ppmValue, maxPpm)}%`,
                }}
                title={`${point.time} — ${point.ppmValue} ppm`}
              />
            ))
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <p>CO₂ ppm by hour (lower is better).</p>
          {maxPpm > 0 && (
            <p>
              Max today:{" "}
              <span className="text-amber-200">
                {Math.round(maxPpm)} ppm
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Live conditions */}
      <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-100">
              Live CO₂ by Location
            </h2>
            <p className="text-xs text-slate-400">
              Last updated: <span className="text-slate-200">5s ago</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 ring-1 ring-emerald-400/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {liveDevices.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              No devices reporting CO₂ data yet.
            </p>
          ) : (
            liveDevices.map((device) => {
              const maxDevicePpm = getMaxPpm(device.hourlyPpmData);

              let status = "No data";
              let statusColor = "text-slate-300";
              if (maxDevicePpm > 0 && maxDevicePpm < 800) {
                status = "Comfortable";
                statusColor = "text-emerald-300";
              } else if (maxDevicePpm >= 800 && maxDevicePpm < 1000) {
                status = "Elevated";
                statusColor = "text-amber-300";
              } else if (maxDevicePpm >= 1000) {
                status = "High";
                statusColor = "text-rose-300";
              }

              const detail =
                device.alertLevel && device.alertLevel !== "Normal"
                  ? device.alertLevel
                  : device.status;

              return (
                <LiveRow
                  key={device.id}
                  label={device.name}
                  co2={maxDevicePpm}
                  status={status}
                  statusColor={statusColor}
                  detail={detail}
                />
              );
            })
          )}
        </div>

        <button className="mt-2 w-full rounded-2xl bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700/80">
          Open realtime stream
        </button>
      </div>
    </section>
  );
}

function LiveRow({ label, co2, status, statusColor, detail }: LiveRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-950/60 px-3 py-2 ring-1 ring-slate-800/80">
      <div>
        <p className="text-xs font-medium text-slate-100">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-slate-100">
          {co2} <span className="text-[10px] text-slate-400">ppm</span>
        </p>
        <p className={`mt-0.5 text-[11px] font-medium ${statusColor}`}>
          {status}
        </p>
      </div>
    </div>
  );
}


