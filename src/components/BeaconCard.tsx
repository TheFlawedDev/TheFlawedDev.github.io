"use client";

import React, { useEffect } from "react";
import { BeaconData } from "./WireframeSphere";

interface BeaconCardProps {
  beacon: BeaconData | null;
  onClose: () => void;
}

export function BeaconCard({ beacon, onClose }: BeaconCardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (beacon) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [beacon, onClose]);

  if (!beacon) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-ios-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beacon-card-title"
    >
      {/* Apple visionOS / iOS Glassmorphic Card Container */}
      <div
        className="relative w-full max-w-md mx-4 rounded-3xl bg-neutral-900/65 backdrop-blur-3xl border border-white/20 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.2)] overflow-hidden p-6 sm:p-7 select-none animate-ios-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle white sheen overlay & Top specular hairline reflection */}
        <div className="absolute inset-0 bg-white/[0.04] pointer-events-none rounded-3xl" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Ambient interior glass glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--green)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header: iOS Pill Indicator & Frosted Close Button */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-md text-xs font-mono text-white/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--green)]" />
              </span>
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                {beacon.category}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/70 hover:text-white cursor-pointer border border-white/10 backdrop-blur-md group"
              aria-label="Close project modal"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Project Title & Tagline */}
          <div>
            <h3
              id="beacon-card-title"
              className="text-2xl sm:text-3xl font-[var(--font-display)] font-semibold text-white tracking-tight leading-tight"
            >
              {beacon.title}
            </h3>
            <p className="text-xs sm:text-sm font-mono text-[var(--green)] font-medium mt-1.5 leading-relaxed">
              {beacon.tagline}
            </p>
          </div>

          {/* Tech Stack Pills (iOS-Native Pill Badges) */}
          <div className="flex flex-wrap gap-1.5">
            {beacon.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full px-3 py-1 bg-white/[0.08] text-white/85 border border-white/10 text-xs backdrop-blur-md font-mono tracking-tight shadow-xs hover:bg-white/[0.12] transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-[13.5px] font-[var(--font-sans)] text-white/75 leading-relaxed font-light">
            {beacon.description}
          </p>

          {/* Metrics Bar: Translucent Inset Container */}
          <div className="grid grid-cols-3 divide-x divide-white/10 p-3 bg-black/35 border border-white/10 rounded-2xl backdrop-blur-md text-center">
            <div className="px-2">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/45 block mb-0.5">
                SENSOR NODE
              </span>
              <span className="text-white font-mono text-xs font-medium">
                #{beacon.id}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/45 block mb-0.5">
                STATUS
              </span>
              <span className="text-[var(--green)] font-mono text-xs font-semibold tracking-wide">
                {beacon.status}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/45 block mb-0.5">
                ORBIT STATE
              </span>
              <span className="text-white/70 font-mono text-xs font-medium">
                PAUSED
              </span>
            </div>
          </div>

          {/* Footer Actions: Esc Dismiss & App Store-Style Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onClose}
              className="text-xs font-mono text-white/50 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-1 group"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] border border-white/15 text-white/70 group-hover:text-white group-hover:border-white/30 transition-colors">
                ESC
              </kbd>
              <span className="text-[11px] tracking-wider uppercase">RESUME ORBIT</span>
            </button>

            <a
              href={beacon.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider text-black bg-gradient-to-r from-emerald-400 via-[var(--green)] to-emerald-300 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.35)] hover:shadow-[0_0_28px_rgba(57,255,20,0.55)] cursor-pointer"
            >
              <span>VIEW REPO</span>
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
