"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
    initLocationPickerMap?: () => void;
  }
}

type LocationPickerProps = {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
};

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "fejf";

  // Load Google Maps script
  useEffect(() => {
    // Check if already loaded
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.MapTypeId &&
      window.google.maps.places
    ) {
      setMapLoaded(true);
      return;
    }

    // Remove any old script tags with callbacks to prevent conflicts
    const oldScripts = document.querySelectorAll<HTMLScriptElement>(
      'script[src*="maps.googleapis.com"]'
    );
    oldScripts.forEach((script) => {
      if (script.src && script.src.includes("callback=")) {
        script.remove();
      }
    });

    // Check if script is already being loaded (without callback)
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]:not([src*="callback="])'
    );
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.MapTypeId &&
          window.google.maps.places
        ) {
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

    // Load Google Maps script with Places library
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setError(
        "Failed to load Google Maps. Please check your API key configuration in Google Cloud Console."
      );
    };

    // Listen for Google Maps errors in the DOM (only check map container, not search input)
    const checkForErrors = () => {
      // Only check for errors in the map container, not in autocomplete dropdowns
      const mapContainer = mapRef.current;
      if (!mapContainer) return false;
      
      const errorElement = mapContainer.querySelector('.gm-err-container, .gm-err-message');
      if (errorElement) {
        const errorText = errorElement.textContent || '';
        if (errorText.includes("can't load Google Maps") || 
            errorText.includes("Do you own this website") ||
            errorText.includes("This page can't load Google Maps")) {
          setError(
            "Google Maps API Error: Please configure your API key correctly in Google Cloud Console."
          );
          return true;
        }
      }
      return false;
    };

    // Check immediately and then periodically (only for map initialization errors)
    let errorCheckCount = 0;
    const maxErrorChecks = 20; // Check for 10 seconds (20 * 500ms)
    
    const errorInterval = setInterval(() => {
      errorCheckCount++;
      if (checkForErrors() || errorCheckCount >= maxErrorChecks) {
        clearInterval(errorInterval);
      }
    }, 500);

    script.onload = () => {
      // Check if Google Maps and Places are loaded
      const checkLoaded = setInterval(() => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.MapTypeId &&
          window.google.maps.places
        ) {
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (
          !window.google ||
          !window.google.maps ||
          !window.google.maps.MapTypeId ||
          !window.google.maps.places
        ) {
          setError(
            "Google Maps failed to initialize. Please check your API key and referrer restrictions in Google Cloud Console."
          );
        }
      }, 10000);
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    // Prevent multiple initializations
    if (mapInstanceRef.current || isInitializingRef.current) return;
    if (!mapLoaded || !window.google || !window.google.maps) return;

    // Wait for map container to be ready and visible
    if (!mapRef.current) return;

    // Check if element is actually in the DOM, has dimensions, and is a valid Element
    const checkElement = (): boolean => {
      const element = mapRef.current;
      if (!element) return false;

      // Ensure it's a valid DOM Element
      if (!(element instanceof HTMLElement)) return false;

      // Ensure it's actually in the document
      if (!document.contains(element)) return false;

      // Ensure it has dimensions (is visible)
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // Ensure it's not hidden
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;

      return true;
    };

    // Use requestAnimationFrame to wait for the next paint cycle
    let rafId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const initializeMap = () => {
      // Prevent multiple calls
      if (isInitializingRef.current || mapInstanceRef.current) return;
      isInitializingRef.current = true;

      // Final check before initialization
      const element = mapRef.current;
      if (!element || !checkElement()) {
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
        const initialCenter =
          latitude && longitude
            ? { lat: latitude, lng: longitude }
            : { lat: 6.9271, lng: 79.8612 }; // Default: Colombo, Sri Lanka

        const googleMap = new window.google.maps.Map(element, {
          zoom: latitude && longitude ? 15 : 10,
          center: initialCenter,
          mapTypeId: window.google.maps.MapTypeId.SATELLITE,
          tilt: 45,
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

        mapInstanceRef.current = googleMap;
        isInitializingRef.current = false;

        // Add click listener to map
        googleMap.addListener("click", (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onLocationChange(lat, lng);
        });

        // Initialize Places Autocomplete will be done in separate useEffect

        // Add initial marker if coordinates are provided
        if (latitude && longitude) {
          markerRef.current = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: googleMap,
            draggable: true,
            title: "Device Location",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#10b981",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });

          // Update location when marker is dragged
          markerRef.current.addListener("dragend", (e: any) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onLocationChange(lat, lng);
          });
        }
      } catch (err: any) {
        isInitializingRef.current = false;
        console.error("Map initialization error:", err);
        
        // Check for specific Google Maps errors
        const errorMessage = err.message || err.toString() || "";
        
        if (errorMessage.includes("RefererNotAllowed") || errorMessage.includes("referrer")) {
          setError(
            "Google Maps API Error: Add your website URL to allowed referrers in Google Cloud Console."
          );
        } else if (errorMessage.includes("InvalidKey") || errorMessage.includes("API key")) {
          setError("Google Maps API Error: Invalid API key. Please check your API key configuration.");
        } else if (errorMessage.includes("can't load") || errorMessage.includes("Do you own")) {
          setError("Google Maps API Error: Please configure your API key correctly in Google Cloud Console.");
        } else {
          setError(`Google Maps API Error: ${errorMessage || "Unknown error. Please check your API key configuration."}`);
        }
      }
    };

    // Wait for element to be ready
    if (!checkElement()) {
      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          if (checkElement()) {
            initializeMap();
          }
        }, 100);
      });
    } else {
      rafId = requestAnimationFrame(() => {
        initializeMap();
      });
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [mapLoaded, latitude, longitude, onLocationChange]);

  // Initialize Places Autocomplete after map is ready
  useEffect(() => {
    if (!mapLoaded) return;
    if (!window.google?.maps?.places) {
      console.warn("Places API not available");
      return;
    }
    if (autocompleteRef.current) {
      // Already initialized
      return;
    }

    // Wait for map and input to be ready
    let retryCount = 0;
    const maxRetries = 25; // 5 seconds max (25 * 200ms)

    const initializeAutocomplete = () => {
      retryCount++;
      
      if (retryCount > maxRetries) {
        console.error("Failed to initialize Places Autocomplete: timeout");
        return;
      }

      if (!mapInstanceRef.current) {
        // Retry after a short delay
        setTimeout(initializeAutocomplete, 200);
        return;
      }

      if (!searchInputRef.current) {
        // Retry after a short delay
        setTimeout(initializeAutocomplete, 200);
        return;
      }

      try {
        // Clear any existing autocomplete
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            types: ["geocode", "establishment"],
            fields: ["geometry", "formatted_address", "name", "place_id"],
            componentRestrictions: undefined, // Allow all countries
          }
        );

        // Bind autocomplete to map bounds (optional, helps prioritize results near map center)
        if (mapInstanceRef.current) {
          autocompleteRef.current.bindTo("bounds", mapInstanceRef.current);
        }

        // Note: Autocomplete errors are handled via console.error interception below
        // We don't set the main error state for autocomplete errors to avoid breaking the map

        // Listen for place selection
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();

          console.log("Place selected:", place);

          if (!place) {
            console.warn("No place selected");
            return;
          }

          // Handle location from place - try multiple methods
          let lat: number | null = null;
          let lng: number | null = null;

          if (place.geometry?.location) {
            const location = place.geometry.location;
            
            // Method 1: If it's a LatLng object with methods
            if (typeof location.lat === "function") {
              lat = location.lat();
              lng = location.lng();
            }
            // Method 2: If it's a LatLng object with properties
            else if (typeof location.lat === "number") {
              lat = location.lat;
              lng = location.lng;
            }
            // Method 3: Try to get from toJSON if available
            else if (typeof location.toJSON === "function") {
              const json = location.toJSON();
              lat = json.lat;
              lng = json.lng;
            }
            // Method 4: Try toString and parse
            else if (typeof location.toString === "function") {
              const str = location.toString();
              const match = str.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
              if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
              }
            }
          }

          console.log("Extracted coordinates:", { lat, lng });

          if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            // Update coordinates immediately
            console.log("Updating coordinates:", { lat, lng });
            onLocationChange(lat, lng);

            // Center map on selected place
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setCenter({ lat, lng });
              mapInstanceRef.current.setZoom(15);
            }

            // Update search input with formatted address
            if (searchInputRef.current) {
              if (place.formatted_address) {
                searchInputRef.current.value = place.formatted_address;
                setSearchQuery(place.formatted_address);
              } else if (place.name) {
                searchInputRef.current.value = place.name;
                setSearchQuery(place.name);
              }
            }
          } else {
            console.error("Failed to extract coordinates from place:", {
              place,
              geometry: place.geometry,
              location: place.geometry?.location,
            });
            console.warn("No valid location data available for selected place");
          }
        });

        console.log("Places Autocomplete initialized successfully", {
          input: searchInputRef.current,
          autocomplete: autocompleteRef.current,
        });
        
        // Listen for console errors related to Places API (but don't break the map)
        // Only show a warning, not a full error that breaks the UI
        const originalError = console.error;
        let placesApiErrorShown = false;
        
        console.error = (...args: any[]) => {
          const errorMessage = args.join(" ");
          if ((errorMessage.includes("ApiTargetBlocked") || 
              errorMessage.includes("not authorized") ||
              errorMessage.includes("Places API error")) && !placesApiErrorShown) {
            placesApiErrorShown = true;
            // Show a non-blocking warning instead of breaking the entire component
            console.warn(
              "⚠️ Places API Error: Places API is not enabled. Search autocomplete will not work. " +
              "Please enable Places API in Google Cloud Console. " +
              "The map will still work, but you'll need to enter coordinates manually."
            );
            // Don't set the main error state - let the map continue working
          }
          originalError.apply(console, args);
        };
        
        // Restore console.error after 10 seconds
        setTimeout(() => {
          console.error = originalError;
        }, 10000);
      } catch (err: any) {
        console.error("Error initializing Places Autocomplete:", err);
        setError(`Failed to initialize search: ${err.message}`);
      }
    };

    // Start initialization
    initializeAutocomplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!markerRef.current) {
      // Create marker if it doesn't exist and we have coordinates
      if (latitude && longitude) {
        markerRef.current = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstanceRef.current,
          draggable: true,
          title: "Device Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#10b981",
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });

        markerRef.current.addListener("dragend", (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onLocationChange(lat, lng);
        });

        mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
        mapInstanceRef.current.setZoom(15);
      }
      return;
    }

    if (latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };
      markerRef.current.setPosition(newPosition);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(newPosition);
      }
    }
  }, [latitude, longitude, onLocationChange]);

  if (error) {
    const isApiKeyError = error.includes("API") || error.includes("API key") || error.includes("can't load");
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-slate-300">
            Select Location on Map
          </label>
        </div>
        <div className="flex h-[300px] sm:h-[400px] items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10">
          <div className="text-center p-3 sm:p-4 max-w-lg">
            <p className="text-xs sm:text-sm text-rose-300 mb-3 font-medium">{error}</p>
            
            {(isApiKeyError || isPlacesApiError) && (
              <div className="text-left text-[11px] sm:text-xs text-slate-300 bg-slate-900/50 p-3 sm:p-4 rounded-xl mb-3 space-y-2 overflow-y-auto max-h-[200px] sm:max-h-none">
                <p className="font-semibold text-slate-200 mb-2">
                  {isPlacesApiError 
                    ? "⚠️ Places API is not enabled for your API key!" 
                    : "To fix this error:"}
                </p>
                <ol className="list-decimal list-inside space-y-1.5 ml-2 text-[10px] sm:text-[11px]">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline break-all">Google Cloud Console → APIs & Services → Credentials</a></li>
                  <li>Click on your API key</li>
                  <li>Under "Application restrictions", add these URLs:
                    <ul className="list-disc list-inside ml-3 sm:ml-4 mt-1 space-y-0.5 text-slate-400">
                      <li><code className="text-[9px] sm:text-[10px] break-all">http://localhost:3000/*</code></li>
                      <li><code className="text-[9px] sm:text-[10px] break-all">http://127.0.0.1:3000/*</code></li>
                      <li><code className="text-[9px] sm:text-[10px] break-all">http://192.168.*.*:3000/*</code></li>
                    </ul>
                  </li>
                  <li>Under "API restrictions", make sure these APIs are enabled:
                    <ul className="list-disc list-inside ml-3 sm:ml-4 mt-1 space-y-0.5 text-slate-400">
                      <li><strong className="text-emerald-400">Maps JavaScript API</strong> (required)</li>
                      <li><strong className="text-emerald-400">Places API</strong> (required for search)</li>
                    </ul>
                    <p className="text-[9px] sm:text-[10px] text-rose-400 mt-1 ml-3 sm:ml-4">
                      ⚠️ If you see "ApiTargetBlockedMapError", the Places API is not enabled!
                    </p>
                  </li>
                  <li>Alternatively, go to <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline break-all">APIs & Services → Library</a> and enable:
                    <ul className="list-disc list-inside ml-3 sm:ml-4 mt-1 space-y-0.5 text-slate-400">
                      <li>Search for "Places API" and click Enable</li>
                      <li>Search for "Maps JavaScript API" and click Enable</li>
                    </ul>
                  </li>
                  <li>Save and wait 1-2 minutes for changes to propagate</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
            
            <p className="text-xs text-slate-400 mb-3">
              You can still enter coordinates manually in the form fields below.
            </p>
            <button
              onClick={() => {
                setError(null);
                setMapLoaded(false);
                window.location.reload();
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Enter coordinates manually in the fields below if the map is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">
          Select Location on Map
        </label>
        {latitude && longitude && (
          <span className="text-[11px] text-emerald-400">
            ✓ Location selected
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          defaultValue={searchQuery}
          onKeyDown={(e) => {
            // Prevent form submission on Enter
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          placeholder="Search for a location or address..."
          className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full h-[300px] sm:h-[400px] rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden"
      />
      <p className="text-[11px] text-slate-400">
        Search for a location, click on the map, or drag the marker to set the device location.
        Coordinates will update automatically.
      </p>
    </div>
  );
}
