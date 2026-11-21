"use client";

import React from "react";

interface NavbarProps {
  onOpenContact: () => void;
}

export function Navbar({ onOpenContact }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tracking-wider font-semibold text-[var(--ink)]">
            jorge velazquez
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] text-[var(--quiet)] px-2 py-0.5 rounded bg-white/5 border border-[var(--line)]">
            full-stack &amp; systems software engineer
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[var(--quiet)]">
            <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-ping" />
            <span className="text-[var(--soft)] font-medium">AVAILABLE FOR WORK</span>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex font-mono text-xs uppercase tracking-wider text-[var(--soft)] hover:text-white items-center gap-1 transition-colors"
          >
            <span>GITHUB</span>
            <span className="text-[var(--green)]">↗</span>
          </a>

          <button
            onClick={onOpenContact}
            className="font-mono text-xs uppercase tracking-wider text-[var(--ink)] hover:text-white px-3.5 py-1.5 rounded border border-[var(--line)] hover:border-[var(--green)]/50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="text-[var(--green)]">●</span>
            <span>CONNECT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
