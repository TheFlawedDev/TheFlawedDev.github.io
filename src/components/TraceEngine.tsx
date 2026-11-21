"use client";

import React, { useState, useEffect } from "react";

interface TraceLine {
  text: string;
  isKeyword?: boolean;
  indent?: number;
  highlight?: boolean;
}

const TRACE_STEPS: { title: string; lines: string[]; status: string }[] = [
  {
    title: "# 01 // Autonomous Agent Harness",
    status: "ACTIVE_EVAL",
    lines: [
      "def run_agent_loop(objective, harness, max_depth=12):",
      "    state = harness.capture_environment()",
      "    memory = PersistentVectorStore(namespace='jorge')",
      "",
      "    while not harness.satisfied(objective):",
      "        plan = model.generate_plan(state, constraints=REAL_TIME)",
      "        for step in plan.executable_steps:",
      "            result = harness.execute_isolated(step)",
      "            memory.record(step, result)",
      "            if result.status == 'VERIFIED':",
      "                continue",
      "        state = harness.reconcile_state()",
      "    return harness.deploy_production()",
    ],
  },
  {
    title: "# 02 // Full-Stack Architecture",
    status: "COMPILED",
    lines: [
      "class ProductionStack:",
      "    backend: SupabasePostgres = PostgresPool(ssl=True)",
      "    compute: VercelEdgeFunctions = ServerlessRuntime()",
      "    tooling: ModelContextProtocol = MCPServerRegistry()",
      "",
      "    async def serve_request(self, payload: Request) -> Response:",
      "        user = await self.backend.auth.validate(payload.jwt)",
      "        cached = await self.compute.edge_cache.get(payload.hash)",
      "        if cached: return cached",
      "        return await self.backend.execute_transaction(payload)",
    ],
  },
  {
    title: "# 03 // Real-Time Verification",
    status: "ZERO_ERRORS",
    lines: [
      "def verify_contract(schema, incoming_stream):",
      "    assert schema.version >= '2.4.0'",
      "    with Benchmark(threshold_ms=45):",
      "        for packet in incoming_stream:",
      "            validate_bounds(packet, strict=True)",
      "            emit_telemetry(packet.digest)",
      "    return {'status': 'PASS', 'latency_p99': '12ms'}",
    ],
  },
];

export function TraceEngine() {
  const [activeChunk, setActiveChunk] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [stepCounter, setStepCounter] = useState(1048);

  useEffect(() => {
    const chunk = TRACE_STEPS[activeChunk];
    const timer = setInterval(() => {
      setCurrentLineIndex((prev) => {
        if (prev + 1 >= chunk.lines.length) {
          // Switch to next chunk after brief pause
          setTimeout(() => {
            setActiveChunk((c) => (c + 1) % TRACE_STEPS.length);
            setCurrentLineIndex(0);
          }, 1200);
          return prev;
        }
        return prev + 1;
      });
      setStepCounter((s) => s + 1);
    }, 450);

    return () => clearInterval(timer);
  }, [activeChunk]);

  const chunk = TRACE_STEPS[activeChunk];

  const formatLine = (raw: string) => {
    // Basic syntax highlighting
    const words = raw.split(" ");
    return words.map((w, idx) => {
      if (
        [
          "def",
          "class",
          "return",
          "while",
          "for",
          "in",
          "if",
          "not",
          "continue",
          "import",
          "async",
          "await",
          "with",
          "assert",
        ].includes(w)
      ) {
        return (
          <span key={idx} className="text-[var(--green)] font-semibold">
            {w}{" "}
          </span>
        );
      }
      if (w.includes("(") || w.includes(")")) {
        return (
          <span key={idx} className="text-[#f2f1ee]">
            {w}{" "}
          </span>
        );
      }
      if (w.startsWith("'") || w.startsWith('"') || w.endsWith("'") || w.endsWith('"')) {
        return (
          <span key={idx} className="text-[#ffcb6b]">
            {w}{" "}
          </span>
        );
      }
      if (w.startsWith("#")) {
        return (
          <span key={idx} className="text-[var(--quiet)] italic">
            {w}{" "}
          </span>
        );
      }
      return <span key={idx}>{w} </span>;
    });
  };

  return (
    <div className="w-full bg-[#111111] border border-[var(--line)] rounded-sm overflow-hidden font-mono text-[13px] shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] bg-[#141414]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-[var(--soft)] font-medium text-xs">
            {chunk.title}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[var(--label)]">
          <span>CYCLE #{stepCounter}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[var(--green)] font-mono text-[10px] border border-[var(--green)]/30">
            {chunk.status}
          </span>
        </div>
      </div>

      {/* Code Window */}
      <div className="p-4 sm:p-6 overflow-x-auto min-h-[340px] flex flex-col justify-start">
        {chunk.lines.map((line, idx) => {
          const isCurrent = idx === currentLineIndex;
          const isPast = idx < currentLineIndex;

          return (
            <div
              key={idx}
              className={`flex items-start gap-4 transition-colors duration-150 py-0.5 ${
                isCurrent
                  ? "bg-white/[0.04] text-[var(--ink)]"
                  : isPast
                  ? "text-[var(--soft)]"
                  : "text-[var(--quiet)]/40"
              }`}
            >
              <span className="select-none w-6 text-right text-[11px] text-[var(--label)]/50 pt-0.5">
                {idx + 1}
              </span>
              <pre className="font-mono flex-1 whitespace-pre">
                {formatLine(line)}
                {isCurrent && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--green)] align-middle animate-pulse" />
                )}
              </pre>
            </div>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2 border-t border-[var(--line)] bg-[#0d0d0d] flex items-center justify-between text-[11px] text-[var(--label)]">
        <div className="flex items-center gap-2">
          <span>RUNTIME KERNEL: ONLINE</span>
          <span>•</span>
          <span>LATENCY: 0.4ms</span>
        </div>
        <div className="flex gap-2">
          {TRACE_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveChunk(i);
                setCurrentLineIndex(0);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeChunk
                  ? "bg-[var(--green)] scale-125"
                  : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
