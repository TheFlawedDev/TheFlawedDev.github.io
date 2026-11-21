"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { WireframeSphere, BeaconData } from "@/components/WireframeSphere";
import { ContactModal } from "@/components/ContactModal";
import { BeaconCard } from "@/components/BeaconCard";

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedBeacon, setSelectedBeacon] = useState<BeaconData | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--green)] selection:text-black flex flex-col justify-between overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar onOpenContact={() => setIsContactOpen(true)} />

      {/* Main Hero Viewport */}
      <main className="hero-container max-w-7xl w-full mx-auto px-5 sm:px-8 flex-1 flex flex-col justify-between pt-28 pb-8 relative">
        {/* The 3D Geodesic Rig Canvas with internal soft body & clickable beacons */}
        <WireframeSphere
          className="rig rig-hero-desktop"
          onSelectBeacon={setSelectedBeacon}
          isPaused={selectedBeacon !== null}
        />

        {/* Text content overlapping the sphere */}
        <div className="relative z-10 max-w-2xl my-auto pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          {/* Definition block */}
          <div className="mb-6 border-l-2 border-[var(--green)] pl-4 py-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--quiet)]">
              [ JORGE VELAZQUEZ // PORTFOLIO ]
            </span>
            <p className="font-[var(--font-serif)] text-2xl sm:text-3xl text-[var(--ink)] mt-1">
              <span className="italic">soft·ware</span> (n.) The translation of human thought into executable architecture.
            </p>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-[var(--font-display)] font-semibold tracking-tight leading-[1.05] mb-6 text-[var(--ink)] drop-shadow-md">
            Full-Stack Software Engineer &amp; <br />
            Systems Builder.
          </h1>

          <p className="text-base sm:text-lg text-[var(--soft)] font-light leading-relaxed max-w-xl mb-8">
            Hi, I&apos;m Jorge. I build robust full-stack web applications, distributed backends, and developer tools using TypeScript, Next.js, Supabase, and Python.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[var(--ink)] text-[var(--bg)] hover:bg-white font-mono text-xs uppercase tracking-widest px-6 py-3.5 rounded-sm transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <span>EXPLORE GITHUB PROJECTS</span>
              <span className="text-[var(--green)] font-bold">↗</span>
            </a>

            <button
              onClick={() => setIsContactOpen(true)}
              className="font-mono text-xs uppercase tracking-widest text-[var(--soft)] hover:text-white px-5 py-3.5 rounded-sm border border-[var(--line)] hover:border-white/40 transition-colors bg-[var(--bg)]/40 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
            >
              <span>GET IN TOUCH</span>
              <span className="text-[var(--green)]">→</span>
            </button>
          </div>
        </div>

        {/* Bottom Links Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-end gap-4 text-[11px] font-mono text-[var(--quiet)] pt-6 mt-12 border-t border-[var(--line)]">
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GITHUB ↗
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              LINKEDIN ↗
            </a>
            <button
              onClick={() => setIsContactOpen(true)}
              className="hover:text-[var(--green)] transition-colors cursor-pointer"
            >
              CONTACT
            </button>
          </div>
        </div>
      </main>

      {/* Translucent Frosted Glass Beacon Card */}
      <BeaconCard
        beacon={selectedBeacon}
        onClose={() => setSelectedBeacon(null)}
      />

      {/* Contact Paper Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

