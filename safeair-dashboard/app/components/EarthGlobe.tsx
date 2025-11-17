"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(
  () => import("react-globe.gl").then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400"></div>
          <p className="text-sm text-slate-400">Loading 3D Earth...</p>
        </div>
      </div>
    ),
  }
);

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

type DeviceMapProps = {
  devices: DeviceSummary[];
};

export function EarthGlobe({ devices }: DeviceMapProps) {
  const globeRef = useRef<any>(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  // Filter devices with valid locations
  const devicesWithLocations = devices.filter((d) => d.location != null);

  // Convert devices to points for the globe
  const points = devicesWithLocations.map((device) => ({
    lat: device.location!.latitude,
    lng: device.location!.longitude,
    size: 0.6, // Slightly larger markers for better visibility
    color: (() => {
      const co2 = device.latestCo2 ?? 0;
      if (co2 >= 1000) return "#ef4444"; // red (high)
      if (co2 >= 800) return "#f59e0b"; // amber (elevated)
      return "#10b981"; // emerald (normal)
    })(),
    device: device,
  }));

  // Get status label
  const getStatus = (co2: number | null): string => {
    if (co2 == null) return "No data";
    if (co2 >= 1000) return "High";
    if (co2 >= 800) return "Elevated";
    return "Normal";
  };


  useEffect(() => {
    if (globeRef.current && devicesWithLocations.length > 0 && isGlobeReady) {
      // Point camera at first device
      const firstDevice = devicesWithLocations[0];
      if (firstDevice?.location) {
        globeRef.current.pointOfView(
          {
            lat: firstDevice.location.latitude,
            lng: firstDevice.location.longitude,
            altitude: 2,
          },
          2000
        );
      }
    }
  }, [devicesWithLocations, isGlobeReady]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-medium text-slate-100">3D Earth Globe View</h2>
        <p className="text-xs text-slate-400">
          Interactive 3D globe - Rotate and zoom with mouse/touch. Click markers to view device details and fly to locations.
        </p>
      </div>
      <div className="relative w-full h-[500px] bg-slate-950">
        <Globe
          ref={globeRef}
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
          pointsData={points}
          pointColor="color"
          pointRadius="size"
          pointLabel={(d: any) => {
            const device = d.device as DeviceSummary;
            return `
              <div style="color: #1e293b; padding: 8px; background: white; border-radius: 4px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                  ${device.deviceUid}
                </h3>
                <p style="margin: 4px 0; font-size: 12px;">
                  <strong>CO₂:</strong> ${device.latestCo2 ? Math.round(device.latestCo2) : "No data"} ppm
                </p>
                <p style="margin: 4px 0; font-size: 12px;">
                  <strong>Status:</strong> ${getStatus(device.latestCo2)}
                </p>
                <p style="margin: 4px 0; font-size: 12px;">
                  <strong>Location:</strong><br/>
                  ${device.location!.latitude.toFixed(6)}, ${device.location!.longitude.toFixed(6)}
                </p>
                ${device.latestRecordedAt ? `
                  <p style="margin: 4px 0; font-size: 11px; color: #64748b;">
                    Updated: ${new Date(device.latestRecordedAt).toLocaleString()}
                  </p>
                ` : ""}
              </div>
            `;
          }}
          onPointClick={(point: any) => {
            // Fly to the point when clicked
            if (globeRef.current) {
              globeRef.current.pointOfView(
                {
                  lat: point.lat,
                  lng: point.lng,
                  altitude: 1.5,
                },
                1000
              );
            }
          }}
          onGlobeReady={() => {
            setIsGlobeReady(true);
          }}
          showAtmosphere={true}
          atmosphereColor="#3a82f6"
          atmosphereAltitude={0.15}
          enablePointerInteraction={true}
          waitForGlobeReady={false}
          animateIn={true}
        />
      </div>
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Normal (&lt;800 ppm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Elevated (800-999 ppm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span>High (≥1000 ppm)</span>
          </div>
          <div className="ml-auto text-slate-500">
            {devicesWithLocations.length} device{devicesWithLocations.length !== 1 ? "s" : ""} on map
          </div>
        </div>
      </div>
    </div>
  );
}

