"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { LocationPicker } from "../../components/LocationPicker";

type RegisterDeviceRequest = {
  deviceUid: string;
  ownerType: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  initialLatitude: number;
  initialLongitude: number;
  phoneModel: string;
};

export default function RegisterDevicePage() {
  const [formData, setFormData] = useState<RegisterDeviceRequest>({
    deviceUid: "",
    ownerType: "COMPANY",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    initialLatitude: 0,
    initialLongitude: 0,
    phoneModel: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "initialLatitude" || name === "initialLongitude"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      initialLatitude: lat,
      initialLongitude: lng,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const baseUrl =
      process.env.NEXT_PUBLIC_LIVE_URL ?? process.env.LIVE_URL ?? "";

    if (!baseUrl) {
      setError("LIVE_URL not configured. Please set NEXT_PUBLIC_LIVE_URL in your environment.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to register device: ${res.status} ${res.statusText}. ${errorText}`
        );
      }

      await res.json();
      setSuccess(true);
      
      // Reset form after successful registration
      setTimeout(() => {
        setFormData({
          deviceUid: "",
          ownerType: "COMPANY",
          ownerName: "",
          ownerEmail: "",
          ownerPhone: "",
          initialLatitude: 0,
          initialLongitude: 0,
          phoneModel: "",
        });
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error registering device", err);
      setError(err.message || "Unable to register device. Please check your API connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardLayout>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
            Register New Device
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Register a new CO₂ monitoring device with owner information and initial GPS location.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Device UID */}
            <div>
              <label
                htmlFor="deviceUid"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Device UID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="deviceUid"
                name="deviceUid"
                value={formData.deviceUid}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                placeholder="e.g., DEVICE123"
              />
            </div>

            {/* Owner Type */}
            <div>
              <label
                htmlFor="ownerType"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Owner Type <span className="text-rose-400">*</span>
              </label>
              <select
                id="ownerType"
                name="ownerType"
                value={formData.ownerType}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
              >
                <option value="COMPANY">Company</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="GOVERNMENT">Government</option>
                <option value="NON_PROFIT">Non-Profit</option>
              </select>
            </div>

            {/* Owner Name */}
            <div>
              <label
                htmlFor="ownerName"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Owner Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                placeholder="e.g., ABC Corporation"
              />
            </div>

            {/* Owner Email */}
            <div>
              <label
                htmlFor="ownerEmail"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Owner Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                id="ownerEmail"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                placeholder="e.g., contact@abccorp.com"
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label
                htmlFor="ownerPhone"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Owner Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                id="ownerPhone"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                placeholder="e.g., +1234567890"
              />
            </div>

            {/* Interactive Map for Location Selection */}
            <div>
              <LocationPicker
                latitude={formData.initialLatitude}
                longitude={formData.initialLongitude}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Location - Latitude and Longitude (Manual Input) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="initialLatitude"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Initial Latitude <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  id="initialLatitude"
                  name="initialLatitude"
                  value={formData.initialLatitude || ""}
                  onChange={handleChange}
                  required
                  step="any"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <label
                  htmlFor="initialLongitude"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Initial Longitude <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  id="initialLongitude"
                  name="initialLongitude"
                  value={formData.initialLongitude || ""}
                  onChange={handleChange}
                  required
                  step="any"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>

            {/* Phone Model */}
            <div>
              <label
                htmlFor="phoneModel"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Phone Model <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="phoneModel"
                name="phoneModel"
                value={formData.phoneModel}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                placeholder="e.g., iPhone 14 Pro"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-medium text-emerald-300">
                  ✓ Device registered successfully!
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-emerald-500/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registering...
                  </span>
                ) : (
                  "Register Device"
                )}
              </button>
              <a
                href="/devices"
                className="w-full sm:w-auto text-center rounded-2xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>

        <footer className="flex flex-col gap-1 pb-2 pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SafeAirTrack. Device Registration
            Portal.
          </p>
          <p className="text-slate-500">
            All fields marked with <span className="text-rose-400">*</span> are
            required.
          </p>
        </footer>
      </DashboardLayout>
    </div>
  );
}

