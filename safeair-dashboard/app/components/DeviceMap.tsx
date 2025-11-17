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

type DeviceMapProps = {
  devices: DeviceSummary[];
};

declare global {
  interface Window {
    google: any;
  }
}

export function DeviceMap({ devices }: DeviceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializingRef = useRef<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "fejf";

  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Remove any old script tags with callbacks to prevent conflicts
    const oldScripts = document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com"]');
    oldScripts.forEach((script) => {
      if (script.src && script.src.includes("callback=")) {
        script.remove();
      }
    });

    // Check if script is already being loaded (without callback)
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

    // Only load if API key is not the placeholder
    if (apiKey === "fejf") {
      setError("Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local");
      return;
    }

    // Load Google Maps script without callback (simpler approach)
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setError("Failed to load Google Maps. Check your API key.");
    };

    script.onload = () => {
      // Check if Google Maps is loaded
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google || !window.google.maps) {
          setError("Google Maps failed to initialize. Check your API key.");
        }
      }, 5000);
    };

    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    // Prevent multiple initializations
    if (map || isInitializingRef.current) return;
    if (!mapLoaded || !window.google || !window.google.maps) return;
    
    // Wait for map container to be ready and visible
    if (!mapRef.current) return;

    // Check if element is actually in the DOM, has dimensions, and is a valid Element
    const checkElement = (): boolean => {
      const element = mapRef.current;
      if (!element) return false;
      
      // Ensure it's a valid DOM Element (not just any object)
      if (!(element instanceof HTMLElement)) return false;
      
      // Ensure it's actually in the document
      if (!document.contains(element)) return false;
      
      // Ensure it has dimensions (is visible)
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      
      // Ensure it's not hidden
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      
      return true;
    };

    // Use requestAnimationFrame to wait for the next paint cycle
    // This ensures the DOM is fully settled before Google Maps tries to observe it
    let rafId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const initializeMap = () => {
      // Prevent multiple calls
      if (isInitializingRef.current || map) return;
      isInitializingRef.current = true;
      
      // Final check before initialization
      const element = mapRef.current;
      if (!element || !(element instanceof HTMLElement) || !checkElement()) {
        isInitializingRef.current = false;
        setError("Map container not ready. Please refresh the page.");
        return;
      }
      
      // Ensure element is still in the DOM right before initialization
      if (!document.contains(element)) {
        isInitializingRef.current = false;
        setError("Map container was removed from DOM.");
        return;
      }
      
      try {
        // Initialize map with 3D view - element is guaranteed to be valid at this point
        const googleMap = new window.google.maps.Map(element, {
          zoom: 10,
          center: { lat: 6.9271, lng: 79.8612 }, // Default center (Colombo, Sri Lanka)
          mapTypeId: window.google.maps.MapTypeId.SATELLITE, // Satellite view for 3D effect
          tilt: 45, // 3D tilt angle (0-45 degrees)
          heading: 0, // Rotation angle
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
          rotateControl: true, // Enable rotation for 3D
          scaleControl: true,
        });

        setMap(googleMap);
        isInitializingRef.current = false;

        // Center map on first device with location and set 3D view
        const deviceWithLocation = devices.find((d) => d.location != null);
        if (deviceWithLocation?.location) {
          googleMap.setCenter({
            lat: deviceWithLocation.location.latitude,
            lng: deviceWithLocation.location.longitude,
          });
          // Set 3D view with tilt
          googleMap.setTilt(45);
          googleMap.setZoom(15);
        } else {
          // Default 3D view
          googleMap.setTilt(45);
        }
      } catch (err: any) {
        isInitializingRef.current = false;
        console.error("Error initializing map:", err);
        if (err?.message?.includes("RefererNotAllowed")) {
          setError("Google Maps API key: Add your site URL to allowed referrers in Google Cloud Console.");
        } else if (err?.message?.includes("observe") || err?.message?.includes("IntersectionObserver")) {
          setError("Map initialization error. Please refresh the page.");
        } else {
          setError("Failed to initialize map. Please refresh the page.");
        }
      }
    };

    // Wait for element to be ready with multiple animation frames
    // This ensures the element is fully rendered and stable
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

      // Element is ready, wait one more frame to ensure stability
      rafId = requestAnimationFrame(() => {
        // Add a small delay to ensure everything is settled
        timeoutId = setTimeout(() => {
          initializeMap();
        }, 100);
      });
    };

    // Start waiting
    rafId = requestAnimationFrame(waitForElement);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      isInitializingRef.current = false;
    };
  }, [mapLoaded, devices, map]);

  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const newMarkers: any[] = [];

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
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Info window with device details
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #1e293b; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
              ${device.deviceUid}
            </h3>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>CO₂:</strong> ${co2 > 0 ? Math.round(co2) : "No data"} ppm
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Location:</strong><br/>
              ${device.location.latitude.toFixed(6)}, ${device.location.longitude.toFixed(6)}
            </p>
            ${device.latestRecordedAt ? `
              <p style="margin: 4px 0; font-size: 11px; color: #64748b;">
                Updated: ${new Date(device.latestRecordedAt).toLocaleString()}
              </p>
            ` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Fit map bounds to show all markers
    if (newMarkers.length > 0) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        newMarkers.forEach((marker) => {
          bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds);
        // Don't zoom in too much if only one marker
        if (newMarkers.length === 1) {
          map.setZoom(15);
        }
      } catch (err) {
        console.error("Error fitting map bounds:", err);
      }
    } else {
      // If no markers, center on default location
      map.setCenter({ lat: 6.9271, lng: 79.8612 });
      map.setZoom(10);
    }

    // Cleanup function
    return () => {
      newMarkers.forEach((marker) => marker.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, devices]);

  if (error) {
    const isRefererError = error.includes("referrers");
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm text-rose-300 text-center">{error}</p>
        {isRefererError ? (
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            <p className="text-center">Add these URLs to your Google Cloud Console:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>http://localhost:3000/*</li>
              <li>http://192.168.*.*:3000/*</li>
              <li>Your production domain</li>
            </ul>
            <p className="text-center mt-2 text-[11px]">
              Go to: APIs & Services → Credentials → Your API Key → Application restrictions
            </p>
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
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60">
        <div className="text-center">
          <p className="text-sm text-slate-400">Loading map...</p>
          <p className="mt-1 text-xs text-slate-500">
            {apiKey === "fejf" ? "Using placeholder API key" : "Initializing Google Maps"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-medium text-slate-100">3D Google Earth View</h2>
        <p className="text-xs text-slate-400">
          Click markers to view device details. Drag to rotate, scroll to zoom. Colors indicate CO₂ levels.
        </p>
      </div>
      <div ref={mapRef} className="w-full h-[500px] bg-slate-950" />
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
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
        </div>
      </div>
    </div>
  );
}

