"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 px-4 py-4 md:flex-row md:gap-6 md:py-6 lg:gap-8 lg:px-8 lg:py-8">
      {/* Mobile header with menu button */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm shadow-slate-900/60"
        >
          <span className="mr-2 flex h-5 w-5 items-center justify-center">
            <span className="block h-0.5 w-4 rounded-full bg-slate-100" />
            <span className="mt-0.5 block h-0.5 w-4 rounded-full bg-slate-100" />
            <span className="mt-0.5 block h-0.5 w-4 rounded-full bg-slate-100" />
          </span>
          Menu
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-tight text-slate-200">
            SafeAirTrack
          </span>
          <span className="text-[10px] text-slate-500">CO₂ Dashboard</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar onLinkClick={undefined} />
      </div>

      {/* Mobile slide-in sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80%] transform bg-transparent transition-transform duration-300 md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full relative">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/90 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700/90"
            aria-label="Close sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <Sidebar onLinkClick={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1">
        <TopBar />
        {children}
      </main>
    </div>
  );
}


