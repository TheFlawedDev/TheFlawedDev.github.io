"use client";

import React, { useRef } from "react";

interface Project {
  id: string;
  tag: string;
  title: string;
  description: string;
  metrics: string;
  stack: string[];
  link?: string;
}

const PROJECTS: Project[] = [
  {
    id: "01",
    tag: "AGENT HARNESS",
    title: "Autonomous Agent Orchestrator",
    description:
      "A sandboxed environment and execution harness for Claude Code & DeepSeek agents with MCP protocol bridges, real-time safety gating, and state reconciliation.",
    metrics: "45ms eval latency • 99.4% task completion",
    stack: ["TypeScript", "Docker", "Node.js", "MCP", "FastAPI"],
  },
  {
    id: "02",
    tag: "PRODUCTION BACKEND",
    title: "Supabase Realtime Sync Engine",
    description:
      "High-throughput transactional backend built on Postgres, Row Level Security, edge functions, and real-time WebSocket state broadcasting.",
    metrics: "12,000 req/s • sub-10ms query p99",
    stack: ["Supabase", "PostgreSQL", "RLS", "Next.js", "Vercel"],
  },
  {
    id: "03",
    tag: "REVERSE ENGINEERING",
    title: "REA Protocol Inspector",
    description:
      "Automated DOM inspection and runtime behavioral reverse engineering system that extracts frontend design tokens, network flows, and state models.",
    metrics: "200+ tool hooks • CDP debugging",
    stack: ["Playwright", "CDP", "Turbopack", "Python", "AST"],
  },
  {
    id: "04",
    tag: "VOICE WORKFLOW",
    title: "Wispr Flow Note Synthesizer",
    description:
      "Voice dictation pipeline extracting structured engineering tickets, PRDs, and user stories directly into AI coding agent workflows.",
    metrics: "Zero-latency sync • Whisper V3",
    stack: ["Wispr Flow API", "Vector Embeddings", "Next.js"],
  },
];

export function ProjectCards() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--quiet)] uppercase tracking-wider">
            [ Selected Systems // 04 Releases ]
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded border border-[var(--line)] flex items-center justify-center text-[var(--soft)] hover:text-white hover:border-white/40 transition-colors"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded border border-[var(--line)] flex items-center justify-center text-[var(--soft)] hover:text-white hover:border-white/40 transition-colors"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      {/* Snap Track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            className="snap-start shrink-0 w-[85vw] sm:w-[380px] md:w-[420px] bg-[#141414] border border-[var(--line)] hover:border-white/30 transition-all p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Ambient accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--green)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] text-[var(--green)] tracking-wider px-2 py-0.5 rounded bg-[var(--green)]/10 border border-[var(--green)]/20">
                  {p.tag}
                </span>
                <span className="font-mono text-xs text-[var(--quiet)] opacity-50">
                  #{p.id}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-[var(--font-display)] font-semibold text-[var(--ink)] mb-3 group-hover:text-white transition-colors">
                {p.title}
              </h3>

              <p className="text-sm text-[var(--quiet)] leading-relaxed mb-6">
                {p.description}
              </p>
            </div>

            <div>
              <div className="font-mono text-xs text-[var(--soft)] py-2 border-t border-[var(--line)] mb-4 flex items-center justify-between">
                <span>{p.metrics}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.stack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-[10px] text-[var(--quiet)] bg-white/5 px-2 py-0.5 rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
