"use client";

import { useEffect, useRef, useState } from "react";

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

declare global {
  interface Window {
    google: any;
  }
}

export function Live3DMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const isInitializingRef = useRef<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "fejf";

  // Fetch devices in real-time
  const fetchDevices = async () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";

    if (!baseUrl) {
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
    } catch (err) {
      console.error("Error fetching live devices", err);
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const oldScripts = document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com"]');
    oldScripts.forEach((script) => {
      if (script.src && script.src.includes("callback=")) {
        script.remove();
      }
    });

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]:not([src*="callback="])');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    if (apiKey === "fejf") {
      setError("Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setError("Google Maps failed to initialize. Check your API key.");
    };

    script.onload = () => {
      setTimeout(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
        } else {
          setError("Google Maps failed to initialize. Check your API key.");
        }
      }, 5000);
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize 3D map
  useEffect(() => {
    if (map || isInitializingRef.current) return;
    if (!mapLoaded || !window.google || !window.google.maps) return;
    if (!mapRef.current) return;

    const checkElement = (): boolean => {
      const element = mapRef.current;
      if (!element) return false;
      if (!(element instanceof HTMLElement)) return false;
      if (!document.contains(element)) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return true;
    };

    let rafId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const initializeMap = () => {
      if (isInitializingRef.current || map) return;
      isInitializingRef.current = true;
      
      const element = mapRef.current;
      if (!element || !(element instanceof HTMLElement) || !checkElement()) {
        isInitializingRef.current = false;
        setError("Map container not ready. Please refresh the page.");
        return;
      }
      
      if (!document.contains(element)) {
        isInitializingRef.current = false;
        setError("Map container was removed from DOM.");
        return;
      }
      
      try {
        // Initialize 3D Google Earth-style map
        const googleMap = new window.google.maps.Map(element, {
          zoom: 10,
          center: { lat: 6.9271, lng: 79.8612 }, // Default center (Colombo, Sri Lanka)
          mapTypeId: window.google.maps.MapTypeId.SATELLITE, // Satellite view like Google Earth
          tilt: 45, // 3D tilt angle
          heading: 0,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: [
              window.google.maps.MapTypeId.SATELLITE,
              window.google.maps.MapTypeId.HYBRID,
              window.google.maps.MapTypeId.ROADMAP,
            ],
          },
          streetViewControl: false,
          fullscreenControl: true,
          rotateControl: true,
          scaleControl: true,
          zoomControl: true,
        });

        setMap(googleMap);
        isInitializingRef.current = false;

        // Set 3D view
        googleMap.setTilt(45);
      } catch (err: any) {
        isInitializingRef.current = false;
        console.error("Error initializing map:", err);
        if (err?.message?.includes("RefererNotAllowed")) {
          setError("Google Maps API key: Add your site URL to allowed referrers in Google Cloud Console.");
        } else {
          setError("Failed to initialize map. Please refresh the page.");
        }
      }
    };

    let frameCount = 0;
    const maxFrames = 10;
    
    const waitForElement = () => {
      if (!checkElement()) {
        frameCount++;
        if (frameCount < maxFrames) {
          rafId = requestAnimationFrame(waitForElement);
        } else {
          setError("Map container not ready. Please refresh the page.");
        }
        return;
      }

      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          initializeMap();
        }, 100);
      });
    };

    rafId = requestAnimationFrame(waitForElement);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      isInitializingRef.current = false;
    };
  }, [mapLoaded, map]);

  // Update markers when devices change
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers and info windows
    markersRef.current.forEach((marker) => marker.setMap(null));
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    const newMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    // Add markers for each device with location
    devices.forEach((device) => {
      if (!device.location) return;

      const co2 = device.latestCo2 ?? 0;
      let markerColor = "#10b981"; // emerald (normal)
      if (co2 >= 1000) markerColor = "#ef4444"; // red (high)
      else if (co2 >= 800) markerColor = "#f59e0b"; // amber (elevated)

      const marker = new window.google.maps.Marker({
        position: {
          lat: device.location.latitude,
          lng: device.location.longitude,
        },
        map: map,
        title: `${device.deviceUid}: ${co2 > 0 ? Math.round(co2) : "No data"} ppm`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.DROP,
      });

      // Info window with device details
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #1e293b; padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
              ${device.deviceUid}
            </h3>
            <p style="margin: 6px 0; font-size: 14px;">
              <strong>CO₂:</strong> <span style="color: ${markerColor}; font-weight: 600;">${co2 > 0 ? Math.round(co2) : "No data"} ppm</span>
            </p>
            <p style="margin: 6px 0; font-size: 14px;">
              <strong>Status:</strong> ${co2 >= 1000 ? "High" : co2 >= 800 ? "Elevated" : "Normal"}
            </p>
            <p style="margin: 6px 0; font-size: 12px; color: #64748b;">
              <strong>Location:</strong><br/>
              ${device.location.latitude.toFixed(6)}, ${device.location.longitude.toFixed(6)}
            </p>
            ${device.latestRecordedAt ? `
              <p style="margin: 6px 0; font-size: 11px; color: #94a3b8;">
                Updated: ${new Date(device.latestRecordedAt).toLocaleString()}
              </p>
            ` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        // Close all other info windows
        newInfoWindows.forEach((iw) => iw.close());
        infoWindow.open(map, marker);
        // Don't auto-center - let user control camera position
      });

      newMarkers.push(marker);
      newInfoWindows.push(infoWindow);
    });

    markersRef.current = newMarkers;
    infoWindowsRef.current = newInfoWindows;

    // Don't auto-center or fit bounds - let user control camera position
    // Markers will be added but camera position remains unchanged

    return () => {
      newMarkers.forEach((marker) => marker.setMap(null));
      newInfoWindows.forEach((infoWindow) => infoWindow.close());
    };
  }, [map, devices]);

  if (error) {
    const isRefererError = error.includes("referrers");
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm text-rose-300 text-center">{error}</p>
        {isRefererError ? (
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            <p className="text-center">Add these URLs to your Google Cloud Console:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>http://localhost:3000/*</li>
              <li>http://192.168.*.*:3000/*</li>
              <li>Your production domain</li>
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400 text-center">
            Make sure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in .env.local
          </p>
        )}
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400"></div>
          <p className="text-sm text-slate-400">Loading 3D Google Earth map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div className="p-3 sm:p-4 border-b border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-100">Live 3D Google Earth Map</h2>
            <p className="text-xs text-slate-400">
              Real-time device locations - Auto-refreshes every 3 seconds. Drag to rotate, scroll to zoom.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
            <span className="text-[10px] text-slate-400">Live</span>
          </div>
        </div>
      </div>
      <div ref={mapRef} className="w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-slate-950" />
      <div className="p-2 sm:p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] sm:text-[11px]">Normal (&lt;800 ppm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-[10px] sm:text-[11px]">Elevated (800-999 ppm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-[10px] sm:text-[11px]">High (≥1000 ppm)</span>
            </div>
          </div>
          <div className="text-slate-500 text-[10px] sm:text-[11px]">
            {devices.filter((d) => d.location != null).length} device{devices.filter((d) => d.location != null).length !== 1 ? "s" : ""} • 
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

