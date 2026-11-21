"use client";

import React, { useEffect, useRef } from "react";
import brainData from "@/data/brainModel.json";

export interface BeaconData {
  id: number;
  category: string;
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  coords: [number, number, number];
  status: string;
  githubUrl: string;
  demoUrl?: string;
}

interface WireframeSphereProps {
  className?: string;
  onSelectBeacon?: (beacon: BeaconData) => void;
  isPaused?: boolean;
}

export function WireframeSphere({
  className,
  onSelectBeacon,
  isPaused = false,
}: WireframeSphereProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const onSelectBeaconRef = useRef(onSelectBeacon);
  onSelectBeaconRef.current = onSelectBeacon;

  useEffect(() => {
    const box = boxRef.current;
    const cv = canvasRef.current;
    const btn = buttonRef.current;
    if (!box || !cv) return;

    const g = cv.getContext("2d");
    if (!g || !window.requestAnimationFrame) return;

    const TAU = Math.PI * 2;
    const SPIN = 80000; /* ms per turn of the sphere */
    const LEAN = 0.14;
    const ELEV = 0.3;
    const CAM = 3.6; /* axis lean, camera elevation (rad); camera distance (radii) */
    const WHITE = "255,255,255";
    const GREEN = "57,255,20";
    const RED = "255, 45, 45";

    function clamp(x: number, a: number, b: number) {
      return x < a ? a : x > b ? b : x;
    }

    /* ---- the sphere: an icosahedron, each face cut into nine and pushed out (92 nodes, 270 struts) ---- */
    const q = (1 + Math.sqrt(5)) / 2;
    const F = 3;
    const V: [number, number, number][] = [];
    const HEAD: boolean[] = [];
    const HEAD_NODES: number[] = [];
    const E: number[] = [];
    const seenV: Record<string, number> = {};
    const seenE: Record<string, number> = {};

    const IV: [number, number, number][] = [
      [-1, q, 0],
      [1, q, 0],
      [-1, -q, 0],
      [1, -q, 0],
      [0, -1, q],
      [0, 1, q],
      [0, -1, -q],
      [0, 1, -q],
      [q, 0, -1],
      [q, 0, 1],
      [-q, 0, -1],
      [-q, 0, 1],
    ];

    const IF = [
      [0, 11, 5],
      [0, 5, 1],
      [0, 1, 7],
      [0, 7, 10],
      [0, 10, 11],
      [1, 5, 9],
      [5, 11, 4],
      [11, 10, 2],
      [10, 7, 6],
      [7, 1, 8],
      [3, 9, 4],
      [3, 4, 2],
      [3, 2, 6],
      [3, 6, 8],
      [3, 8, 9],
      [4, 9, 5],
      [2, 4, 11],
      [6, 2, 10],
      [8, 6, 7],
      [9, 8, 1],
    ];

    const cp = 1 / Math.sqrt(1 + q * q);
    const sp = q * cp;

    function node(
      a: [number, number, number],
      b: [number, number, number],
      c: [number, number, number],
      i: number,
      j: number
    ) {
      const k = F - i - j;
      let x = a[0] * k + b[0] * i + c[0] * j;
      let y = a[1] * k + b[1] * i + c[1] * j;
      let z = a[2] * k + b[2] * i + c[2] * j;
      const l = Math.sqrt(x * x + y * y + z * z);
      x /= l;
      y /= l;
      z /= l;
      const t = y * cp + z * sp;
      z = z * cp - y * sp;
      y = t;
      const key = `${Math.round(x * 1e4)} ${Math.round(y * 1e4)} ${Math.round(z * 1e4)}`;
      if (!(key in seenV)) {
        const vIdx = V.length;
        seenV[key] = vIdx;
        V.push([x, y, z]);
        const isHead = i === 1 && j === 1;
        HEAD.push(isHead);
        if (isHead) HEAD_NODES.push(vIdx);
      }
      return seenV[key];
    }

    function strut(a: number, b: number) {
      const key = a < b ? `${a} ${b}` : `${b} ${a}`;
      if (!seenE[key]) {
        seenE[key] = 1;
        E.push(a, b);
      }
    }

    IF.forEach((f) => {
      const A = IV[f[0]];
      const B = IV[f[1]];
      const C = IV[f[2]];
      const at: number[][] = [];
      for (let i = 0; i <= F; i++) {
        at[i] = [];
        for (let j = 0; j <= F - i; j++) {
          at[i][j] = node(A, B, C, i, j);
        }
      }
      for (let i = 0; i < F; i++) {
        for (let j = 0; j < F - i; j++) {
          strut(at[i][j], at[i + 1][j]);
          strut(at[i + 1][j], at[i][j + 1]);
          strut(at[i][j + 1], at[i][j]);
        }
      }
    });

    const NV = V.length;
    const WX: number[] = [];
    const WY: number[] = [];
    const WZ: number[] = [];
    const PX: number[] = [];
    const PY: number[] = [];
    const PD: number[] = [];

    /* ---- The 3D Brain Model (Rigid single-piece transformation from Brain_Model.obj) ---- */
    const brainVerts = brainData.vertices;
    const brainEdges = brainData.edges;
    const brainCount = brainData.vertexCount;
    // Geometric centroid of brainModel.json
    const cx = -0.0021;
    const cy = -0.0284;
    const cz = -0.0318;

    let wobbleAt = -1e9;
    let wobbleX = 0;
    let wobbleY = 0;

    function swap() {
      if (systemState === "unfolding" || systemState === "dropped" || systemState === "recovering") return;

      const now = clock;
      lastBrainClickT = now;
      wobbleAt = now;
      const intensity = 0.12 + heat * 0.14;
      wobbleX = (Math.random() - 0.5) * intensity;
      wobbleY = (Math.random() - 0.5) * intensity;

      // Each click increases overload heat
      heat = Math.min(1.0, heat + 0.16);

      if (heat >= 1.0) {
        // TOP JOINTS DISCONNECT: Cables detach from sphere & sphere unrolls flat!
        triggerSphereUnfold();
      } else {
        if (heat >= 0.65) {
          systemState = "critical";
        } else if (heat >= 0.35) {
          systemState = "overload";
        } else {
          systemState = "normal";
        }
        triggerBrainBurst();
      }
    }

    const hit = { x: 0, y: 0, r: 0 };

    /* ---- 20 Umbilical Cable Anchors (Connecting 20 Needle Sensors to Brain Cortex) ---- */
    const CABLE_ANCHORS = [
      { headIdx: 5, brainIdx: 1066 },
      { headIdx: 13, brainIdx: 671 },
      { headIdx: 19, brainIdx: 1034 },
      { headIdx: 25, brainIdx: 285 },
      { headIdx: 28, brainIdx: 969 },
      { headIdx: 34, brainIdx: 620 },
      { headIdx: 40, brainIdx: 867 },
      { headIdx: 46, brainIdx: 976 },
      { headIdx: 52, brainIdx: 489 },
      { headIdx: 58, brainIdx: 455 },
      { headIdx: 65, brainIdx: 687 },
      { headIdx: 71, brainIdx: 768 },
      { headIdx: 76, brainIdx: 780 },
      { headIdx: 81, brainIdx: 808 },
      { headIdx: 84, brainIdx: 640 },
      { headIdx: 87, brainIdx: 682 },
      { headIdx: 88, brainIdx: 956 },
      { headIdx: 89, brainIdx: 65 },
      { headIdx: 90, brainIdx: 368 },
      { headIdx: 91, brainIdx: 627 },
    ];

    let cableLag = 0;
    let cableLagVel = 0;
    interface CablePulse {
      cableIdx: number;
      startT: number;
      duration: number;
      g: boolean;
      r?: boolean;
      sparked?: boolean;
    }

    // Meltdown & Overload State Machine
    let heat = 0; // 0.0 (calm) -> 1.0 (meltdown / detonation)
    let lastBrainClickT = -1e9;
    type SystemMeltdownState = "normal" | "overload" | "critical" | "unfolding" | "dropped" | "recovering";
    let systemState: SystemMeltdownState = "normal";
    let unfoldAt = -1e9;
    let recoverStartT = -1e9;

    // 3D explosion shard state for 92 sphere nodes
    const expX = new Float32Array(92);
    const expY = new Float32Array(92);
    const expZ = new Float32Array(92);
    const expVx = new Float32Array(92);
    const expVy = new Float32Array(92);
    const expVz = new Float32Array(92);
    interface SparkParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
    }
    const sparks: SparkParticle[] = [];

    function spawnSparks(x: number, y: number, color: string, count = 4) {
      for (let k = 0; k < count; k++) {
        const ang = Math.random() * TAU;
        const spd = (1.5 + Math.random() * 2.5) * U;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 16 + Math.floor(Math.random() * 10),
          color,
        });
      }
    }

    function evalBez(
      p0x: number, p0y: number,
      p1x: number, p1y: number,
      p2x: number, p2y: number,
      p3x: number, p3y: number,
      u: number
    ): [number, number] {
      const inv = 1 - u;
      const inv2 = inv * inv;
      const inv3 = inv2 * inv;
      const u2 = u * u;
      const u3 = u2 * u;
      return [
        inv3 * p0x + 3 * inv2 * u * p1x + 3 * inv * u2 * p2x + u3 * p3x,
        inv3 * p0y + 3 * inv2 * u * p1y + 3 * inv * u2 * p2y + u3 * p3y,
      ];
    }
    let cablePulses: CablePulse[] = [];
    let nextCablePulse = 800;

    function triggerSphereUnfold() {
      systemState = "unfolding";
      unfoldAt = clock;
      heat = 1.0;
      vel = 0;

      // Top joints disconnect: release sparks at upper nodes (y > 0.5)
      for (let k = 0; k < NV; k++) {
        if (V[k][1] > 0.5 && PX[k] !== undefined) {
          spawnSparks(PX[k], PY[k], RED, 3);
        }
      }
      cablePulses.length = 0;
    }

    function triggerBrainBurst() {
      // More cables fire as heat builds up
      const baseCount = heat >= 0.65 ? 14 : heat >= 0.35 ? 8 : 4;
      const count = Math.min(CABLE_ANCHORS.length, baseCount + Math.floor(Math.random() * 4));
      const shuffled = [...Array(CABLE_ANCHORS.length).keys()].sort(() => Math.random() - 0.5);

      const isRed = heat >= 0.35;
      const speedFactor = heat >= 0.65 ? 0.65 : heat >= 0.35 ? 0.8 : 1.0;

      for (let k = 0; k < count; k++) {
        const idx = shuffled[k];
        const isGreen = !isRed && Math.random() < 0.35;
        const dur = (1500 + Math.random() * 400) * speedFactor;
        const delay = k * (heat >= 0.65 ? 30 : heat >= 0.35 ? 50 : 80);

        cablePulses.push({
          cableIdx: idx,
          startT: clock + delay,
          duration: dur,
          g: isGreen,
          r: isRed,
        });
        const head = CABLE_ANCHORS[idx].headIdx;
        events.push({
          v: head,
          t: clock + delay + dur,
          g: isGreen,
        });
      }
    }

    /* ---- Drawing & 8-band depth buckets ---- */
    let S = 0;
    let R = 0;
    let C0 = 0;
    let U = 1;
    let LW = 1;
    let dpr = 1;
    const NB = 8;
    const bucket: number[][] = [];
    const pt = [0, 0, 0];
    const SX: number[] = [];
    const SY: number[] = [];
    const SD: number[] = [];

    const OS = 1.5;
    for (let i = 0; i < NB; i++) bucket.push([]);

    let ce = Math.cos(ELEV);
    let se = Math.sin(ELEV);
    const cl = Math.cos(LEAN);
    const sl = Math.sin(LEAN);

    function project(x: number, y: number, z: number) {
      const y2 = y * ce - z * se;
      const z2 = y * se + z * ce;
      const s = CAM / (CAM - z2);
      pt[0] = C0 + x * R * s;
      pt[1] = C0 - y2 * R * s;
      pt[2] = (z2 + 1) / 2;
      return pt;
    }

    function put(d: number, x0: number, y0: number, x1: number, y1: number) {
      bucket[Math.max(0, Math.min(NB - 1, (d * NB) | 0))].push(
        x0,
        y0,
        x1,
        y1
      );
    }

    function stroke(rgb: string, a0: number, a1: number, ex?: number) {
      for (let b = 0; b < NB; b++) {
        const L = bucket[b];
        const tb = Math.pow((b + 0.5) / NB, ex || 1);
        if (!L.length) continue;
        g!.beginPath();
        for (let k = 0; k < L.length; k += 4) {
          g!.moveTo(L[k], L[k + 1]);
          g!.lineTo(L[k + 2], L[k + 3]);
        }
        g!.strokeStyle = `rgba(${rgb},${(a0 + (a1 - a0) * tb).toFixed(3)})`;
        g!.stroke();
        L.length = 0;
      }
    }

    function flash(dt: number) {
      return dt < 0
        ? 0
        : dt < 60
        ? dt / 60
        : Math.pow(Math.max(0, 1 - (dt - 60) / 600), 2);
    }

    function getBrainTransform(t: number) {
      const br = 1 + 0.012 * Math.sin((t / 2800) * TAU);
      const hoverY = Math.sin((t / 2400) * TAU) * 0.006;
      const f = OS * br;

      let wTilt = 0;
      let wYaw = 0;
      let wBounceY = 0;
      const dtWobble = (t - wobbleAt) / 1000;
      if (dtWobble >= 0 && dtWobble < 1.0) {
        const decay = Math.exp(-4 * dtWobble);
        const pulse = Math.sin(18 * dtWobble) * decay;
        wTilt = wobbleX * pulse;
        wYaw = wobbleY * pulse;
        wBounceY = Math.sin(15 * dtWobble) * decay * 0.015;
      }

      const effYaw = yaw + wYaw;
      const effCs = Math.cos(effYaw);
      const effSn = Math.sin(effYaw);
      return { f, hoverY, wBounceY, wTilt, effCs, effSn };
    }

    function drawBrain(t: number, cs: number, sn: number) {
      const { f, hoverY, wBounceY, wTilt, effCs, effSn } = getBrainTransform(t);

      let mx = 0;
      let my = 0;
      let r = 0;

      // Rigid 3D vertex projection: zero deformation, zero drift, 100% ONE piece
      for (let i = 0, j = 0; i < brainCount; i++, j += 3) {
        const X0 = (brainVerts[j] - cx) * f;
        const Y0 = (brainVerts[j + 1] - cy) * f + hoverY + wBounceY;
        const Z0 = (brainVerts[j + 2] - cz) * f;

        const rotX = X0 * effCs + Z0 * effSn;
        const rotY = Y0 + wTilt * X0;
        const rotZ = Z0 * effCs - X0 * effSn;

        const p = project(rotX, rotY, rotZ);
        SX[i] = p[0];
        SY[i] = p[1];
        SD[i] = (p[2] - 0.5) * 4 + 0.5;
        mx += p[0];
        my += p[1];
      }

      // 3D wireframe edges with 8-band depth sorting
      for (let i = 0; i < brainEdges.length; i += 2) {
        const a = brainEdges[i];
        const b = brainEdges[i + 1];
        put(
          (SD[a] + SD[b]) / 2,
          SX[a],
          SY[a],
          SX[b],
          SY[b]
        );
      }
      const brainColor =
        (systemState === "unfolding" || systemState === "dropped")
          ? (clock - unfoldAt < 2000 ? RED : "255, 140, 80")
          : heat >= 0.65
          ? RED
          : heat >= 0.35
          ? "255, 120, 60"
          : WHITE;
      const bAlpha0 = 0.05 + 0.15 * heat;
      const bAlpha1 = 0.35 + 0.25 * heat;
      stroke(brainColor, bAlpha0, bAlpha1);

      hit.x = mx / brainCount;
      hit.y = my / brainCount;
      for (let i = 0; i < brainCount; i++) {
        r = Math.max(
          r,
          (SX[i] - hit.x) * (SX[i] - hit.x) +
            (SY[i] - hit.y) * (SY[i] - hit.y)
        );
      }
      hit.r = Math.max(Math.sqrt(r) + 16 * U, 0.1 * S);
    }

    /* ---- Draw Polished Loose Umbilical Cables (Needle Sensors <-> Brain) ---- */
    function drawCables(t: number, cs: number, sn: number, isFront: boolean) {
      const { f, hoverY, wBounceY, wTilt, effCs, effSn } = getBrainTransform(t);
      const isDetached = systemState === "unfolding" || systemState === "dropped";
      const isRecovering = systemState === "recovering";
      const recElapsed = isRecovering ? t - recoverStartT : 0;
      const recProg = isRecovering ? clamp(recElapsed / 1400, 0, 1) : 0;

      // Reconnect progress: cables reach back to needle sensors during latter half of recovery
      const rehookProg = isRecovering ? clamp((recProg - 0.55) / 0.45, 0, 1) : 0;

      for (let i = 0; i < CABLE_ANCHORS.length; i++) {
        const { headIdx, brainIdx } = CABLE_ANCHORS[i];

        // 1. Brain cortex surface anchor (p3 stays FIRMLY attached to the brain)
        const bj = brainIdx * 3;
        const bX0 = (brainVerts[bj] - cx) * f;
        const bY0 = (brainVerts[bj + 1] - cy) * f + hoverY + wBounceY;
        const bZ0 = (brainVerts[bj + 2] - cz) * f;
        const p3x = bX0 * effCs + bZ0 * effSn;
        const p3y = bY0 + wTilt * bX0;
        const p3z = bZ0 * effCs - bX0 * effSn;

        // Normal direction emerging from brain
        const bDist = Math.hypot(bX0, bY0, bZ0) || 1e-4;
        const bNormX = (bX0 / bDist) * effCs + (bZ0 / bDist) * effSn;
        const bNormY = (bY0 / bDist);
        const bNormZ = (bZ0 / bDist) * effCs - (bX0 / bDist) * effSn;

        // 2. Normal needle sensor anchor on sphere
        const v = V[headIdx];
        const x = v[0] * cs + v[2] * sn;
        const z = v[2] * cs - v[0] * sn;
        const wx = x * cl - v[1] * sl;
        const wy = x * sl + v[1] * cl;
        const wz = z;
        const origP0x = wx * 0.95;
        const origP0y = wy * 0.95;
        const origP0z = wz * 0.95;

        // 3. Dangling severed cable calculation (disconnected from sphere, attached to brain)
        const swayPhase = t * 0.0022 + i * 1.35;
        const swayX = Math.sin(swayPhase) * 0.035;
        const swayZ = Math.cos(swayPhase * 0.92) * 0.035;

        // Hanging position beneath brain
        const hangP0x = p3x + bNormX * 0.08 + swayX * 1.5;
        const hangP0y = p3y - 0.36 + Math.sin(swayPhase * 0.7) * 0.02;
        const hangP0z = p3z + bNormZ * 0.08 + swayZ * 1.5;

        const hangP1x = p3x + bNormX * 0.12 + swayX;
        const hangP1y = p3y - 0.20;
        const hangP1z = p3z + bNormZ * 0.12 + swayZ;

        const hangP2x = p3x + bNormX * 0.06;
        const hangP2y = p3y - 0.07;
        const hangP2z = p3z + bNormZ * 0.06;

        let p0x: number, p0y: number, p0z: number;
        let p1x: number, p1y: number, p1z: number;
        let p2x: number, p2y: number, p2z: number;

        if (isDetached) {
          // Detach transition: outer end snaps off needle and drops down
          const detachElapsed = t - unfoldAt;
          const dropFrac = clamp(detachElapsed / 500, 0, 1);
          const easeDrop = 0.5 - 0.5 * Math.cos(dropFrac * Math.PI);

          p0x = origP0x * (1 - easeDrop) + hangP0x * easeDrop;
          p0y = origP0y * (1 - easeDrop) + hangP0y * easeDrop;
          p0z = origP0z * (1 - easeDrop) + hangP0z * easeDrop;

          p1x = (origP0x * 0.7 + p3x * 0.3) * (1 - easeDrop) + hangP1x * easeDrop;
          p1y = (origP0y * 0.7 + p3y * 0.3) * (1 - easeDrop) + hangP1y * easeDrop;
          p1z = (origP0z * 0.7 + p3z * 0.3) * (1 - easeDrop) + hangP1z * easeDrop;

          p2x = (origP0x * 0.3 + p3x * 0.7) * (1 - easeDrop) + hangP2x * easeDrop;
          p2y = (origP0y * 0.3 + p3y * 0.7) * (1 - easeDrop) + hangP2y * easeDrop;
          p2z = (origP0z * 0.3 + p3z * 0.7) * (1 - easeDrop) + hangP2z * easeDrop;
        } else if (isRecovering) {
          // Reconnecting: cable tips lift up from hanging state and snap back into needles
          const easeHook = 0.5 - 0.5 * Math.cos(rehookProg * Math.PI);
          p0x = hangP0x * (1 - easeHook) + origP0x * easeHook;
          p0y = hangP0y * (1 - easeHook) + origP0y * easeHook;
          p0z = hangP0z * (1 - easeHook) + origP0z * easeHook;

          p1x = hangP1x * (1 - easeHook) + (origP0x * 0.68 + p3x * 0.32) * easeHook;
          p1y = hangP1y * (1 - easeHook) + (origP0y * 0.68 + p3y * 0.32) * easeHook;
          p1z = hangP1z * (1 - easeHook) + (origP0z * 0.68 + p3z * 0.32) * easeHook;

          p2x = hangP2x * (1 - easeHook) + (origP0x * 0.32 + p3x * 0.68) * easeHook;
          p2y = hangP2y * (1 - easeHook) + (origP0y * 0.32 + p3y * 0.68) * easeHook;
          p2z = hangP2z * (1 - easeHook) + (origP0z * 0.32 + p3z * 0.68) * easeHook;
        } else {
          // Normal attached catenary chord geometry
          const dx = p3x - origP0x;
          const dy = p3y - origP0y;
          const dz = p3z - origP0z;
          const chordLen = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
          const ux = dx / chordLen;
          const uz = dz / chordLen;

          const mx = (origP0x + p3x) * 0.5;
          const mz = (origP0z + p3z) * 0.5;
          const mR = Math.sqrt(mx * mx + mz * mz) || 1e-4;

          const tanX = -mz / mR;
          const tanZ = mx / mR;
          const dragX = tanX * cableLag * 0.85;
          const dragZ = tanZ * cableLag * 0.85;

          const radX = (mx / mR) * Math.min(vel * vel * 250, 0.08);
          const radZ = (mz / mR) * Math.min(vel * vel * 250, 0.08);

          let latX = -uz;
          let latZ = ux;
          let latLen = Math.sqrt(latX * latX + latZ * latZ);
          if (latLen < 0.1) { latX = 1; latZ = 0; latLen = 1; }
          latX /= latLen; latZ /= latLen;
          const phase = i * 1.31 + 0.4;
          const slackX = latX * Math.cos(phase) * 0.16;
          const slackY = -0.075 + Math.sin(phase) * 0.045 + Math.sin((t / 2200) * TAU + phase) * 0.012;
          const slackZ = latZ * Math.cos(phase) * 0.16;

          let activePulse: CablePulse | null = null;
          for (let pIdx = cablePulses.length - 1; pIdx >= 0; pIdx--) {
            const p = cablePulses[pIdx];
            if (p.cableIdx === i) {
              const elapsed = t - p.startT;
              if (elapsed >= 0 && elapsed <= p.duration + 450) {
                activePulse = p;
                break;
              }
            }
          }

          let rippleX = 0;
          let rippleZ = 0;
          if (activePulse) {
            const uWave = clamp((t - activePulse.startT) / activePulse.duration, 0, 1);
            const waveAmp = Math.sin(uWave * Math.PI) * 0.018;
            rippleX = latX * Math.sin(uWave * 10) * waveAmp;
            rippleZ = latZ * Math.sin(uWave * 10) * waveAmp;
          }

          const dispX = dragX + radX + slackX + rippleX;
          const dispY = slackY;
          const dispZ = dragZ + radZ + slackZ + rippleZ;

          p0x = origP0x; p0y = origP0y; p0z = origP0z;
          p1x = p0x + dx * 0.32 + dispX * 0.7;
          p1y = p0y + dy * 0.32 + dispY * 0.7;
          p1z = p0z + dz * 0.32 + dispZ * 0.7;

          p2x = p0x + dx * 0.68 + dispX * 0.95;
          p2y = p0y + dy * 0.68 + dispY * 0.95;
          p2z = p0z + dz * 0.68 + dispZ * 0.95;
        }

        // Perspective projection
        const proj0 = project(p0x, p0y, p0z);
        const cp0x = proj0[0], cp0y = proj0[1], cp0z = proj0[2];

        const proj1 = project(p1x, p1y, p1z);
        const cp1x = proj1[0], cp1y = proj1[1];

        const proj2 = project(p2x, p2y, p2z);
        const cp2x = proj2[0], cp2y = proj2[1];

        const proj3 = project(p3x, p3y, p3z);
        const cp3x = proj3[0], cp3y = proj3[1], cp3z = proj3[2];

        const d_avg = (cp0z + cp3z) * 0.5;
        if (isFront && d_avg < 0.48) continue;
        if (!isFront && d_avg >= 0.48) continue;

        if (isDetached) {
          // --- DANGLING CABLES DISCONNECTED FROM SPHERE ---
          const detachElapsed = t - unfoldAt;
          const cableDangleColor = detachElapsed < 1200 ? RED : "160, 185, 210";
          const dangleAlpha = isFront ? 0.35 : 0.18;

          g!.strokeStyle = `rgba(${cableDangleColor}, ${dangleAlpha.toFixed(3)})`;
          g!.lineWidth = (isFront ? 0.75 : 0.45) * U;
          g!.beginPath();
          g!.moveTo(cp0x, cp0y);
          g!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          g!.stroke();

          // Brain cortex electrode socket (still firmly connected!)
          g!.fillStyle = `rgba(${cableDangleColor}, 0.8)`;
          g!.beginPath();
          g!.arc(cp3x, cp3y, (isFront ? 1.5 : 1.0) * U, 0, TAU);
          g!.fill();

          // Detached metal plug hanging at the free tip
          g!.fillStyle = `rgba(${WHITE}, 0.9)`;
          g!.beginPath();
          g!.arc(cp0x, cp0y, (isFront ? 1.3 : 0.9) * U, 0, TAU);
          g!.fill();
          continue;
        }

        // Check for active neural pulse travelling along this cable
        let activePulse: CablePulse | null = null;
        for (let pIdx = cablePulses.length - 1; pIdx >= 0; pIdx--) {
          const p = cablePulses[pIdx];
          if (p.cableIdx === i) {
            const elapsed = t - p.startT;
            if (elapsed >= 0 && elapsed <= p.duration + 450) {
              activePulse = p;
              break;
            }
          }
        }

        if (!activePulse) {
          // INACTIVE CABLE
          const sheathAlpha = isFront ? 0.085 : 0.04;
          const sheathBaseColor = isRecovering ? GREEN : heat >= 0.65 ? RED : heat >= 0.35 ? "255, 110, 80" : "160, 185, 210";
          g!.strokeStyle = `rgba(${sheathBaseColor}, ${sheathAlpha.toFixed(3)})`;
          g!.lineWidth = (isFront ? 0.65 : 0.4) * U;
          g!.beginPath();
          g!.moveTo(cp0x, cp0y);
          g!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          g!.stroke();

          const coreAlpha = isFront ? 0.045 : 0.022;
          g!.strokeStyle = `rgba(${WHITE}, ${coreAlpha.toFixed(3)})`;
          g!.lineWidth = (isFront ? 0.35 : 0.2) * U;
          g!.beginPath();
          g!.moveTo(cp0x, cp0y);
          g!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          g!.stroke();

          // Tension Ferrules along cable length
          const ferruleU = [0.28, 0.52, 0.76];
          for (let fIdx = 0; fIdx < ferruleU.length; fIdx++) {
            const fu = ferruleU[fIdx];
            const fpt = evalBez(cp3x, cp3y, cp2x, cp2y, cp1x, cp1y, cp0x, cp0y, fu);
            g!.fillStyle = `rgba(${isRecovering ? GREEN : "180, 205, 230"}, ${(sheathAlpha * 1.5).toFixed(3)})`;
            g!.beginPath();
            g!.arc(fpt[0], fpt[1], (isFront ? 0.75 : 0.5) * U, 0, TAU);
            g!.fill();
          }

          // Needle collar
          g!.strokeStyle = `rgba(${isRecovering ? GREEN : "180, 205, 230"}, ${(sheathAlpha * 1.8).toFixed(3)})`;
          g!.lineWidth = 0.7 * U;
          g!.beginPath();
          g!.arc(cp0x, cp0y, (isFront ? 1.2 : 0.8) * U, 0, TAU);
          g!.stroke();

          // Brain electrode socket
          g!.strokeStyle = `rgba(${isRecovering ? GREEN : "180, 205, 230"}, ${(sheathAlpha * 2.0).toFixed(3)})`;
          g!.lineWidth = 0.7 * U;
          g!.beginPath();
          g!.arc(cp3x, cp3y, (isFront ? 1.4 : 1.0) * U, 0, TAU);
          g!.stroke();
          g!.fillStyle = `rgba(${WHITE}, ${(coreAlpha * 2.5).toFixed(3)})`;
          g!.beginPath();
          g!.arc(cp3x, cp3y, (isFront ? 0.7 : 0.45) * U, 0, TAU);
          g!.fill();
        } else {
          // ACTIVATED CABLE
          const elapsed = t - activePulse.startT;
          const u = clamp(elapsed / activePulse.duration, 0, 1);
          const pulseColor = activePulse.r ? RED : activePulse.g ? GREEN : WHITE;
          const glowColor = activePulse.r ? "255, 65, 65" : activePulse.g ? "0, 255, 136" : "190, 230, 255";

          let act = 1.0;
          if (elapsed < 100) {
            act = elapsed / 100;
          } else if (elapsed > activePulse.duration) {
            act = Math.max(0, 1 - (elapsed - activePulse.duration) / 450);
          }

          g!.strokeStyle = `rgba(${glowColor}, ${(0.18 * act).toFixed(3)})`;
          g!.lineWidth = ((isFront ? 2.0 : 1.3) + 0.9 * act) * U;
          g!.beginPath();
          g!.moveTo(cp0x, cp0y);
          g!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          g!.stroke();

          const litAlpha = isFront ? 0.20 + 0.65 * act : 0.10 + 0.38 * act;
          g!.strokeStyle = `rgba(${pulseColor}, ${litAlpha.toFixed(3)})`;
          g!.lineWidth = ((isFront ? 0.85 : 0.55) + 0.5 * act) * U;
          g!.beginPath();
          g!.moveTo(cp0x, cp0y);
          g!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          g!.stroke();

          g!.strokeStyle = `rgba(${WHITE}, ${(0.75 * act).toFixed(3)})`;
          g!.lineWidth = (isFront ? 0.45 : 0.3) * U;
          g!.beginPath();
          g!.moveTo(cp0x, cp0y);
          g!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
          g!.stroke();

          // Ferrules
          const ferruleU = [0.28, 0.52, 0.76];
          for (let fIdx = 0; fIdx < ferruleU.length; fIdx++) {
            const fu = ferruleU[fIdx];
            const fpt = evalBez(cp3x, cp3y, cp2x, cp2y, cp1x, cp1y, cp0x, cp0y, fu);
            const dist = Math.abs(u - fu);
            const ferrulePing = dist < 0.09 ? Math.max(0, 1 - dist / 0.09) : 0;
            const fRad = ((isFront ? 0.8 : 0.55) + 0.9 * ferrulePing) * U;
            const fColor = ferrulePing > 0.4 ? WHITE : pulseColor;
            g!.fillStyle = `rgba(${fColor}, ${(0.35 + 0.65 * ferrulePing).toFixed(3)})`;
            g!.beginPath();
            g!.arc(fpt[0], fpt[1], fRad, 0, TAU);
            g!.fill();
          }

          // Multi-Packet
          const packets = [{ pos: u, scale: 1.0 }, { pos: u - 0.09, scale: 0.62 }];
          for (let pK = 0; pK < packets.length; pK++) {
            const pu = packets[pK].pos;
            if (pu < 0 || pu > 1.05) continue;
            const pScale = packets[pK].scale;

            const cometLen = 0.14 * pScale;
            const cometSteps = 8;
            for (let s = 0; s < cometSteps; s++) {
              const segU0 = Math.max(0, pu - (s / cometSteps) * cometLen);
              const segU1 = Math.max(0, pu - ((s + 1) / cometSteps) * cometLen);
              if (segU0 <= 0 && segU1 <= 0) break;

              const pt0 = evalBez(cp3x, cp3y, cp2x, cp2y, cp1x, cp1y, cp0x, cp0y, segU0);
              const pt1 = evalBez(cp3x, cp3y, cp2x, cp2y, cp1x, cp1y, cp0x, cp0y, segU1);

              const frac = 1 - s / cometSteps;
              const segWidth = (0.4 + frac * 1.3 * pScale) * U;
              const segAlpha = (frac * frac * 0.92 * act).toFixed(3);
              const segColor = frac > 0.72 ? WHITE : pulseColor;

              g!.strokeStyle = `rgba(${segColor}, ${segAlpha})`;
              g!.lineWidth = segWidth;
              g!.beginPath();
              g!.moveTo(pt0[0], pt0[1]);
              g!.lineTo(pt1[0], pt1[1]);
              g!.stroke();
            }

            if (pu <= 1.0) {
              const headPt = evalBez(cp3x, cp3y, cp2x, cp2y, cp1x, cp1y, cp0x, cp0y, pu);
              g!.fillStyle = `rgba(${glowColor}, ${(0.42 * act * pScale).toFixed(3)})`;
              g!.beginPath();
              g!.arc(headPt[0], headPt[1], (3.4 * pScale + 1.2 * act) * U, 0, TAU);
              g!.fill();

              g!.fillStyle = `rgba(${pulseColor}, ${(0.85 * act * pScale).toFixed(3)})`;
              g!.beginPath();
              g!.arc(headPt[0], headPt[1], (1.8 * pScale + 0.7 * act) * U, 0, TAU);
              g!.fill();

              g!.fillStyle = `rgba(${WHITE}, ${(0.98 * act).toFixed(3)})`;
              g!.beginPath();
              g!.arc(headPt[0], headPt[1], (0.9 * pScale + 0.4 * act) * U, 0, TAU);
              g!.fill();
            }
          }

          // Brain launch flare
          const launchGlow = u < 0.22 ? (1 - u / 0.22) : 0;
          if (launchGlow > 0) {
            const ringR = (1.5 + 3.8 * (1 - launchGlow)) * U;
            g!.strokeStyle = `rgba(${pulseColor}, ${(0.8 * launchGlow).toFixed(3)})`;
            g!.lineWidth = (0.8 * launchGlow) * U;
            g!.beginPath();
            g!.arc(cp3x, cp3y, ringR, 0, TAU);
            g!.stroke();
          }
          g!.fillStyle = `rgba(${pulseColor}, ${(0.4 + 0.6 * act).toFixed(3)})`;
          g!.beginPath();
          g!.arc(cp3x, cp3y, ((isFront ? 1.5 : 1.1) + 0.8 * launchGlow) * U, 0, TAU);
          g!.fill();
          g!.fillStyle = `rgba(${WHITE}, ${(0.9 + 0.1 * launchGlow).toFixed(3)})`;
          g!.beginPath();
          g!.arc(cp3x, cp3y, (isFront ? 0.8 : 0.5) * U, 0, TAU);
          g!.fill();

          // Needle impact
          if (u > 0.82) {
            const impactFrac = (u - 0.82) / 0.18;
            const impactAlpha = Math.min(1, impactFrac * 1.4);

            g!.fillStyle = `rgba(${pulseColor}, ${(0.90 * impactAlpha * act).toFixed(3)})`;
            g!.beginPath();
            g!.arc(cp0x, cp0y, ((isFront ? 1.6 : 1.2) + 1.5 * impactFrac) * U, 0, TAU);
            g!.fill();

            g!.strokeStyle = `rgba(${WHITE}, ${(0.92 * impactAlpha * act).toFixed(3)})`;
            g!.lineWidth = 0.9 * U;
            g!.beginPath();
            g!.arc(cp0x, cp0y, (1.5 + 3.5 * impactFrac) * U, 0, TAU);
            g!.stroke();

            if (u >= 0.92 && !activePulse.sparked) {
              activePulse.sparked = true;
              spawnSparks(cp0x, cp0y, pulseColor, 4);
            }
          }
        }
      }
    }

    interface EventRay {
      v: number;
      t: number;
      g: boolean;
      n?: number;
    }
    let events: EventRay[] = [];
    let next = 1100;
    let lon = Math.random() * TAU;

    function capture(t: number) {
      const c = Math.cos(lon);
      const s = Math.sin(lon);
      const line: number[] = [];
      for (let k = 0; k < NV; k++) {
        const v = V[k];
        if (
          Math.abs(v[2] * c - v[0] * s) < 0.17 &&
          v[0] * c + v[2] * s > 0 &&
          Math.abs(v[1]) < 0.97
        ) {
          line.push(k);
        }
      }
      const green =
        line.length && Math.random() < 0.12
          ? line[Math.floor(Math.random() * line.length)]
          : -1;
      for (let k = 0; k < line.length; k++) {
        const v = line[k];
        events.push({
          v,
          t: t + (Math.acos(V[v][1]) / Math.PI) * 640,
          g: v === green,
        });
      }
      lon += TAU / 11;
    }

    let ang = 0;
    let vel = 0;
    let tilt = 0;
    const par = [0, 0];
    const want = [0, 0];
    let yaw = 0;
    let lastYaw = 0;
    let lastW = 0;
    let acc = 0;

    function turn(dt: number) {
      const k = 1 - Math.exp(-dt / 260);
      let e: number;
      if (isPausedRef.current) {
        vel = 0;
      } else if (!drag || drag.dead) {
        const autoSpin = !still ? (TAU / SPIN) * dt : 0;
        ang += vel * dt + autoSpin;
        vel *= Math.exp(-dt / 700);
        if (Math.abs(vel) < 1e-6) vel = 0;
        tilt *= Math.exp(-dt / 1200);
        if (ang > TAU || ang < -TAU) {
          e = ang > 0 ? TAU : -TAU;
          ang -= e;
          lastYaw -= e;
        }
      }
      par[0] += (want[0] - par[0]) * k;
      par[1] += (want[1] - par[1]) * k;
      yaw = ang + par[0] * 0.07;
      e = ELEV + tilt + par[1] * 0.05;
      ce = Math.cos(e);
      se = Math.sin(e);
    }

    function simulate(dt: number) {
      const dYaw = yaw - lastYaw;
      lastYaw = yaw;
      for (let k = 0; k < events.length; k++) {
        const e = events[k];
        if (!e.n && e.t <= clock) {
          e.n = 1;
        }
      }

      // Cable physics simulation (inertial lag & elasticity)
      const targetLag = -clamp(vel * 60 + (dYaw / (dt || 16)) * 0.18, -0.45, 0.45);
      const springK = 16;
      const damping = 0.88;
      const dtSec = Math.min(dt, 50) / 1000;
      cableLagVel += (targetLag - cableLag) * springK * dtSec;
      cableLagVel *= Math.pow(damping, dt / 16);
      cableLag += cableLagVel * dtSec;

      // Overload heat & meltdown state updates
      if (systemState !== "unfolding" && systemState !== "dropped" && systemState !== "recovering") {
        if (clock - lastBrainClickT > 650) {
          heat = Math.max(0, heat - (dt / 1000) * 0.15);
          if (heat < 0.35) {
            systemState = "normal";
          } else if (heat < 0.65) {
            systemState = "overload";
          } else {
            systemState = "critical";
          }
        }
        if (systemState === "critical" && Math.random() < 0.4) {
          const randHead = CABLE_ANCHORS[Math.floor(Math.random() * CABLE_ANCHORS.length)].headIdx;
          spawnSparks(PX[randHead], PY[randHead], RED, 3);
        }
      } else if (systemState === "unfolding") {
        const unfoldElapsed = clock - unfoldAt;
        if (unfoldElapsed >= 2200) {
          // Sheet has completely fallen out of view
          systemState = "dropped";
        }
      } else if (systemState === "dropped") {
        // Brain sits exposed with dangling cables for ~1.5s, then begins re-wrapping
        if (clock - unfoldAt >= 3600) {
          systemState = "recovering";
          recoverStartT = clock;
        }
      } else if (systemState === "recovering") {
        const recElapsed = clock - recoverStartT;
        if (recElapsed >= 1400) {
          systemState = "normal";
          heat = 0;
          // Restorative green calibration sweep across all 20 cables
          for (let k = 0; k < CABLE_ANCHORS.length; k++) {
            cablePulses.push({
              cableIdx: k,
              startT: clock + k * 30,
              duration: 1200,
              g: true,
              r: false,
            });
          }
        }
      }
    }

    function draw(t: number) {
      const cs = Math.cos(yaw);
      const sn = Math.sin(yaw);
      g!.setTransform(dpr, 0, 0, dpr, 0, 0);
      g!.clearRect(0, 0, S, S);
      g!.lineWidth = LW;

      // Screen shaking when critical or during top joints release
      let shakeX = 0;
      let shakeY = 0;
      if (systemState === "critical") {
        const shakeAmp = ((heat - 0.65) / 0.35) * 8.0 * U;
        shakeX = (Math.random() - 0.5) * shakeAmp;
        shakeY = (Math.random() - 0.5) * shakeAmp;
      } else if (systemState === "unfolding") {
        const unfElapsed = t - unfoldAt;
        if (unfElapsed < 400) {
          const releaseShake = (1 - unfElapsed / 400) * 9.0 * U;
          shakeX = (Math.random() - 0.5) * releaseShake;
          shakeY = (Math.random() - 0.5) * releaseShake;
        }
      }
      if (shakeX || shakeY) {
        g!.translate(shakeX, shakeY);
      }

      /* Nodes and struts: Spherical shell / Unfolding paper sheet / Re-wrapping */
      if (systemState === "dropped") {
        // Sphere has fallen out of view; only exposed brain and dangling cables exist!
      } else if (systemState === "unfolding") {
        const unfElapsed = t - unfoldAt;
        const uUnfold = clamp(unfElapsed / 750, 0, 1);
        const easeUnfold = 0.5 - 0.5 * Math.cos(uUnfold * Math.PI);

        // Aerodynamic paper falling flutter
        const fallTimeSec = Math.max(0, (unfElapsed - 380) / 1000);
        const dropY = -(fallTimeSec * 1.5 + 0.5 * 1.8 * fallTimeSec * fallTimeSec);
        const flutterRoll = Math.sin(fallTimeSec * 4.2) * 0.14 * Math.min(1, fallTimeSec * 2);
        const flutterPitch = Math.cos(fallTimeSec * 3.6) * 0.10 * Math.min(1, fallTimeSec * 2);
        const driftX = Math.sin(fallTimeSec * 3.0) * 0.22 * Math.min(1, fallTimeSec);

        const cosR = Math.cos(flutterRoll);
        const sinR = Math.sin(flutterRoll);
        const cosP = Math.cos(flutterPitch);
        const sinP = Math.sin(flutterPitch);

        for (let k = 0; k < NV; k++) {
          const v = V[k];
          // Arc distance from bottom pole (-1 to 1)
          const distFromBottom = Math.acos(clamp(-v[1], -1, 1));
          const h = Math.sqrt(v[0] * v[0] + v[2] * v[2]) || 1e-4;
          const flatRadius = distFromBottom * 0.95;
          const flatX = (v[0] / h) * flatRadius;
          const flatZ = (v[2] / h) * flatRadius;
          const flatY = -1.05;

          // Interpolate spherical shape into flat paper sheet
          let nx = v[0] * (1 - easeUnfold) + flatX * easeUnfold;
          let ny = v[1] * (1 - easeUnfold) + flatY * easeUnfold;
          let nz = v[2] * (1 - easeUnfold) + flatZ * easeUnfold;

          // Apply fall and aerodynamic paper flutter
          if (fallTimeSec > 0) {
            const ny2 = ny * cosP - nz * sinP;
            const nz2 = ny * sinP + nz * cosP;
            const nx2 = nx * cosR - ny2 * sinR;
            ny = (nx * sinR + ny2 * cosR) + dropY;
            nx = nx2 + driftX;
            nz = nz2;
          }

          // Apply current orientation
          const rx = nx * cs + nz * sn;
          const rz = nz * cs - nx * sn;
          WX[k] = rx * cl - ny * sl;
          WY[k] = rx * sl + ny * cl;
          WZ[k] = rz;

          const p = project(WX[k], WY[k], WZ[k]);
          PX[k] = p[0];
          PY[k] = p[1];
          PD[k] = p[2];
        }

        for (let k = 0; k < E.length; k += 2) {
          put(
            (PD[E[k]] + PD[E[k + 1]]) / 2,
            PX[E[k]],
            PY[E[k]],
            PX[E[k + 1]],
            PY[E[k + 1]]
          );
        }
        // Fading sheet as it falls out of view
        const sheetAlpha = Math.max(0, 1 - fallTimeSec / 2.0);
        stroke(RED, 0.03 * sheetAlpha, 0.28 * sheetAlpha, 1.4);
      } else if (systemState === "recovering") {
        // Holographic matrix paper sheet rising and re-wrapping around the brain
        const recElapsed = t - recoverStartT;
        const recProg = clamp(recElapsed / 1400, 0, 1);

        // Rise from below, then wrap from flat to sphere
        const riseProg = clamp(recProg / 0.5, 0, 1);
        const easeRise = Math.pow(1 - riseProg, 2);
        const wrapProg = clamp((recProg - 0.45) / 0.55, 0, 1);
        const easeWrap = 0.5 - 0.5 * Math.cos(wrapProg * Math.PI);

        for (let k = 0; k < NV; k++) {
          const v = V[k];
          const distFromBottom = Math.acos(clamp(-v[1], -1, 1));
          const h = Math.sqrt(v[0] * v[0] + v[2] * v[2]) || 1e-4;
          const flatRadius = distFromBottom * 0.95;
          const flatX = (v[0] / h) * flatRadius;
          const flatZ = (v[2] / h) * flatRadius;
          const flatY = -1.05 - easeRise * 2.0;

          // Wrap back from flat sheet into 3D geodesic sphere
          const nx = flatX * (1 - easeWrap) + v[0] * easeWrap;
          const ny = flatY * (1 - easeWrap) + v[1] * easeWrap;
          const nz = flatZ * (1 - easeWrap) + v[2] * easeWrap;

          const rx = nx * cs + nz * sn;
          const rz = nz * cs - nx * sn;
          WX[k] = rx * cl - ny * sl;
          WY[k] = rx * sl + ny * cl;
          WZ[k] = rz;

          const p = project(WX[k], WY[k], WZ[k]);
          PX[k] = p[0];
          PY[k] = p[1];
          PD[k] = p[2];
        }

        for (let k = 0; k < E.length; k += 2) {
          put(
            (PD[E[k]] + PD[E[k + 1]]) / 2,
            PX[E[k]],
            PY[E[k]],
            PX[E[k + 1]],
            PY[E[k + 1]]
          );
        }
        stroke(GREEN, 0.04 * recProg, 0.40 * recProg, 1.6);
      } else {
        // Normal spherical housing
        for (let k = 0; k < NV; k++) {
          const v = V[k];
          const x = v[0] * cs + v[2] * sn;
          const z = v[2] * cs - v[0] * sn;
          WX[k] = x * cl - v[1] * sl;
          WY[k] = x * sl + v[1] * cl;
          WZ[k] = z;
          const p = project(WX[k], WY[k], z);
          PX[k] = p[0];
          PY[k] = p[1];
          PD[k] = p[2];
        }

        for (let k = 0; k < E.length; k += 2) {
          put(
            (PD[E[k]] + PD[E[k + 1]]) / 2,
            PX[E[k]],
            PY[E[k]],
            PX[E[k + 1]],
            PY[E[k + 1]]
          );
        }

        const sphereColor = heat >= 0.65 ? RED : WHITE;
        const sAlpha0 = heat >= 0.65 ? 0.05 : 0.022;
        const sAlpha1 = heat >= 0.65 ? 0.38 : 0.15;
        stroke(sphereColor, sAlpha0, sAlpha1, 1.8);
      }

      /* Inward lidar rays */
      if (systemState === "normal" || systemState === "overload" || systemState === "critical") {
        for (let k = 0; k < events.length; k++) {
          const e = events[k];
          const f = flash(t - e.t);
          if (!f) continue;
          const v = e.v;
          const w = f * (0.45 + 0.55 * PD[v]);
          const c = e.g ? GREEN : WHITE;
          const p = project(WX[v] * 0.22, WY[v] * 0.22, WZ[v] * 0.22);
          const gr = g!.createLinearGradient(PX[v], PY[v], p[0], p[1]);
          gr.addColorStop(0, `rgba(${c},${(0.3 * w).toFixed(3)})`);
          gr.addColorStop(1, `rgba(${c},${(0.04 * w).toFixed(3)})`);
          g!.strokeStyle = gr;
          g!.beginPath();
          g!.moveTo(PX[v], PY[v]);
          g!.lineTo(p[0], p[1]);
          g!.stroke();
        }
      }

      /* Back loose umbilical cables (behind brain) */
      drawCables(t, cs, sn, false);

      /* 3D Brain interior object (single rigid unit) */
      drawBrain(t, cs, sn);

      /* Front loose umbilical cables (in front of brain) */
      drawCables(t, cs, sn, true);

      /* Node joints and inward radial needle sensors */
      if (systemState !== "dropped") {
        const nodeAlphaMult =
          systemState === "unfolding"
            ? Math.max(0, 1 - Math.max(0, (t - unfoldAt - 380) / 1000) / 2.0)
            : systemState === "recovering"
            ? clamp((t - recoverStartT) / 1400, 0, 1)
            : 1.0;

        if (nodeAlphaMult > 0.001) {
          g!.lineCap = "round";
          g!.lineWidth = 2.2 * U;
          for (let k = 0; k < NV; k++) {
            const d = PD[k] * PD[k];
            if (HEAD[k]) {
              const p = project(WX[k] * 0.95, WY[k] * 0.95, WZ[k] * 0.95);
              const needleColor = systemState === "recovering" ? GREEN : heat >= 0.65 ? RED : WHITE;
              g!.strokeStyle = `rgba(${needleColor},${((0.08 + 0.32 * d) * nodeAlphaMult).toFixed(3)})`;
              g!.beginPath();
              g!.moveTo(PX[k], PY[k]);
              g!.lineTo(p[0], p[1]);
              g!.stroke();

              // Inward needle sensor collar at geodesic surface
              const collarAlpha = (0.25 + 0.55 * d) * nodeAlphaMult;
              g!.fillStyle = `rgba(${needleColor},${collarAlpha.toFixed(3)})`;
              g!.beginPath();
              g!.arc(PX[k], PY[k], 1.4 * U, 0, TAU);
              g!.fill();
            } else {
              g!.fillStyle = `rgba(${WHITE},${((0.035 + 0.17 * d) * nodeAlphaMult).toFixed(3)})`;
              g!.beginPath();
              g!.arc(PX[k], PY[k], 0.9 * U, 0, TAU);
              g!.fill();
            }
          }
          g!.lineCap = "butt";
          g!.lineWidth = LW;
        }
      }

      /* Node flashes */
      if (systemState === "normal" || systemState === "overload" || systemState === "critical") {
        for (let k = 0; k < events.length; k++) {
        const e = events[k];
        const f = flash(t - e.t);
        if (!f) continue;
        const v = e.v;
        const w = f * (0.45 + 0.55 * PD[v]);
        const c = e.g ? GREEN : WHITE;
        const hr = 9 * U;
        const hg = g!.createRadialGradient(
          PX[v],
          PY[v],
          0,
          PX[v],
          PY[v],
          hr
        );
        hg.addColorStop(0, `rgba(${c},${(0.2 * w).toFixed(3)})`);
        hg.addColorStop(1, `rgba(${c},0)`);
        g!.fillStyle = hg;
        g!.fillRect(PX[v] - hr, PY[v] - hr, hr * 2, hr * 2);
        g!.fillStyle = `rgba(${c},${(0.85 * w).toFixed(3)})`;
        g!.beginPath();
        g!.arc(
          PX[v],
          PY[v],
          ((HEAD[v] ? 1.8 : 1) + 1.2 * f) * U,
          0,
          TAU
        );
        g!.fill();
        }
      }

      /* Electric Micro-Sparks from Sensor Impacts */
      for (let k = sparks.length - 1; k >= 0; k--) {
        const s = sparks[k];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.92;
        s.vy *= 0.92;
        s.life++;
        if (s.life >= s.maxLife) {
          sparks.splice(k, 1);
          continue;
        }
        const prog = s.life / s.maxLife;
        const spAlpha = (1 - prog) * 0.95;
        g!.strokeStyle = `rgba(${s.color},${spAlpha.toFixed(3)})`;
        g!.lineWidth = (1.4 * (1 - prog * 0.5)) * U;
        g!.beginPath();
        g!.moveTo(s.x, s.y);
        g!.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
        g!.stroke();
      }

      /* Cybernetic Overload & Unfolding HUD Alerts */
      if (systemState !== "normal") {
        g!.save();
        g!.font = `bold ${Math.round(10 * U)}px monospace`;
        g!.textAlign = "center";
        if (systemState === "overload") {
          g!.fillStyle = "rgba(255, 140, 60, 0.9)";
          g!.fillText(`[ WARNING: NEURAL CORE OVERCLOCK // VOLTAGE SPIKE ]`, hit.x, hit.y - hit.r - 18 * U);
        } else if (systemState === "critical") {
          const blink = Math.sin(t * 0.02) > 0;
          g!.fillStyle = blink ? "rgba(255, 45, 45, 0.95)" : "rgba(255, 200, 200, 0.75)";
          g!.fillText(`[ CRITICAL OVERLOAD: ${Math.round(heat * 100)}% // THERMAL RUNAWAY ]`, hit.x, hit.y - hit.r - 18 * U);
        } else if (systemState === "unfolding") {
          g!.fillStyle = "rgba(255, 65, 65, 0.95)";
          g!.fillText(`[ TOP JOINTS DECOUPLED // FLATTENING GEODESIC MATRIX ]`, hit.x, hit.y - hit.r - 18 * U);
        } else if (systemState === "dropped") {
          g!.fillStyle = "rgba(255, 140, 80, 0.9)";
          g!.fillText(`[ HOUSING EJECTED // EXPOSED NEURAL CORE ]`, hit.x, hit.y - hit.r - 18 * U);
        } else if (systemState === "recovering") {
          g!.fillStyle = "rgba(57, 255, 20, 0.95)";
          g!.fillText(`[ RE-WRAPPING GEODESIC HOUSING... ]`, hit.x, hit.y - hit.r - 18 * U);
        }
        g!.restore();
      }

      /* Hovered Beacon Targeting Reticle */
      if (hoveredBeacon !== null && PX[hoveredBeacon] !== undefined && systemState === "normal") {
        const hx = PX[hoveredBeacon];
        const hy = PY[hoveredBeacon];
        const isHead = HEAD[hoveredBeacon];
        const sensorIdx = HEAD_NODES.indexOf(hoveredBeacon);
        const projIdx = sensorIdx !== -1 ? (sensorIdx % PROJECTS.length) : (hoveredBeacon % PROJECTS.length);
        const proj = PROJECTS[projIdx];

        g!.save();
        // Outer pulsing targeting ring
        g!.strokeStyle = `rgba(${GREEN}, 0.95)`;
        g!.lineWidth = 1.6 * U;
        g!.beginPath();
        g!.arc(hx, hy, (isHead ? 8.5 : 6.5) * U + Math.sin(t / 120) * 2 * U, 0, TAU);
        g!.stroke();

        if (isHead) {
          // Extra inner ring for needle sensors
          g!.strokeStyle = "rgba(255, 255, 255, 0.85)";
          g!.lineWidth = 1.0 * U;
          g!.beginPath();
          g!.arc(hx, hy, 4 * U, 0, TAU);
          g!.stroke();
        }

        // Floating project label
        g!.fillStyle = `rgba(${GREEN}, 0.95)`;
        g!.font = `600 ${Math.round(10 * U)}px monospace`;
        const label = isHead
          ? `SENSOR #${hoveredBeacon} // ${proj.title.toUpperCase()}`
          : `NODE #${hoveredBeacon} // ${proj.title.toUpperCase()}`;
        g!.fillText(label, hx + 12 * U, hy - 4 * U);

        // Status / Category tag
        g!.fillStyle = "rgba(255, 255, 255, 0.75)";
        g!.font = `${Math.round(8.5 * U)}px monospace`;
        g!.fillText(`${proj.category} • [CLICK TO VIEW]`, hx + 12 * U, hy + 8 * U);

        g!.restore();
      }
    }

    /* ---- Beacon Data (4 Real GitHub Projects) ---- */
    const PROJECTS = [
      {
        title: "Desktop Stage",
        category: "CREATIVE TOOLS & WEBCODECS",
        tagline: "Local-first browser composition studio for screenlife desktop video animation.",
        description: "An in-browser timeline and canvas editor for composing animated desktop scenes. Features zero-upload IndexedDB local media storage, multi-track keyframing, and client-side hardware-accelerated video rendering via WebCodecs (MP4/WebM).",
        stack: ["TypeScript", "React", "Turborepo", "WebCodecs", "IndexedDB", "Vitest"],
        githubUrl: "https://github.com/TheFlawedDev/desktop-stage",
        status: "ACTIVE EXPERIMENT",
      },
      {
        title: "KubeCon SLC Navigator",
        category: "CLOUD NATIVE & SEARCH",
        tagline: "Map-first planner with hybrid semantic search & interactive venue heatmaps.",
        description: "Built at the WeMakeDevs Cloud Native Hackathon (KubeCon NA). Features hybrid search combining OpenAI embeddings (kNN vector) and BM25 lexical search in Elasticsearch across 580+ sessions, mapped onto multi-level SVG architectural blueprints with automated schedule conflict detection.",
        stack: ["Python", "JavaScript", "Elasticsearch", "OpenAI", "Docker"],
        githubUrl: "https://github.com/TheFlawedDev/KubeCon-CloudNativeCon-Hackathon",
        status: "HACKATHON WINNER",
      },
      {
        title: "Synonym Network Explorer",
        category: "GRAPH ALGORITHMS & SYSTEMS",
        tagline: "High-performance semantic relationship analyzer powered by directed graphs.",
        description: "Traverses linguistic semantic networks using custom graph algorithms. Words are mapped as vertices and synonyms as edges, with an on-demand symbol table for memory-efficient definition resolution and a Semantic Distance Calculator to evaluate lexical affinity.",
        stack: ["Java", "Maven", "Docker", "REST API", "Graph Theory"],
        githubUrl: "https://github.com/TheFlawedDev/Synonym-Network-Explorer",
        status: "STABLE",
      },
      {
        title: "Pixly Sprite Editor",
        category: "NATIVE DESKTOP & GRAPHICS",
        tagline: "Frame-by-frame animated sprite and pixel art studio built from scratch in C++.",
        description: "A native desktop creative suite utilizing a decoupled Model-View-Controller (MVC) architecture. Features an interactive timeline with playback control, multi-layer canvas, undo/redo command stack, and custom pixel-manipulation tools (burn/dodge, flood fill, eyedropper).",
        stack: ["C++", "Qt", "QMake", "GUI Architecture", "Computer Graphics"],
        githubUrl: "https://github.com/TheFlawedDev/Pixly-Sprite-Editor",
        status: "RELEASED",
      },
    ];

    function getBeaconInfo(id: number): BeaconData {
      const v = V[id];
      const sensorIdx = HEAD_NODES.indexOf(id);
      const projIdx = sensorIdx !== -1 ? (sensorIdx % PROJECTS.length) : (id % PROJECTS.length);
      const proj = PROJECTS[projIdx];
      return {
        id,
        category: proj.category,
        title: proj.title,
        tagline: proj.tagline,
        description: proj.description,
        stack: proj.stack,
        coords: [v[0], v[1], v[2]],
        status: proj.status,
        githubUrl: proj.githubUrl,
      };
    }

    let hoveredBeacon: number | null = null;

    function findBeacon(p: [number, number]): number | null {
      if (systemState === "unfolding" || systemState === "dropped" || systemState === "recovering") return null;

      // 1. High-priority hit test: Needle sensors (HEAD[k] === true)
      // Checks proximity to outer base node AND along inward needle projection
      let closestHead: number | null = null;
      let minHeadDist = 32 * U; // Generous hit radius prioritizing needle sensors

      for (let i = 0; i < HEAD_NODES.length; i++) {
        const k = HEAD_NODES[i];
        if (PD[k] < 0.38) continue; // Front-facing only

        // Check distance to base node
        const dx = p[0] - PX[k];
        const dy = p[1] - PY[k];
        const dBase = Math.sqrt(dx * dx + dy * dy);

        // Check distance to inward needle tip
        const tip = project(WX[k] * 0.95, WY[k] * 0.95, WZ[k] * 0.95);
        const dTip = Math.hypot(p[0] - tip[0], p[1] - tip[1]);

        const dMin = Math.min(dBase, dTip);
        if (dMin < minHeadDist) {
          minHeadDist = dMin;
          closestHead = k;
        }
      }

      if (closestHead !== null) {
        return closestHead;
      }

      // 2. Secondary fallback: check any front-facing node if close enough
      let closest: number | null = null;
      let minDist = 18 * U;
      for (let k = 0; k < NV; k++) {
        if (PD[k] < 0.42) continue; // Front-facing nodes only
        const dx = p[0] - PX[k];
        const dy = p[1] - PY[k];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) {
          minDist = d;
          closest = k;
        }
      }
      return closest;
    }

    /* ---- Pointer & Interaction handling ---- */
    interface DragState {
      id: number;
      x: number;
      y: number;
      x0: number;
      y0: number;
      t0: number;
      touch: boolean;
      obj: boolean;
      moved: boolean;
      dead: boolean;
    }
    let drag: DragState | null = null;
    let over: [number, number] | null = null;
    const trail: number[] = [];
    let tapAt = -1e9;

    function at(e: PointerEvent): [number, number] {
      const r = cv!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    function onObject(p: [number, number]) {
      const dx = p[0] - hit.x;
      const dy = p[1] - hit.y;
      return hit.r > 0 && dx * dx + dy * dy < hit.r * hit.r;
    }
    function cursor() {
      if (!box) return;
      if (systemState === "unfolding" || systemState === "dropped" || systemState === "recovering") {
        box.style.cursor = "default";
        return;
      }
      box.style.cursor = drag
        ? drag.obj && !drag.moved
          ? "pointer"
          : "grabbing"
        : hoveredBeacon !== null
        ? "pointer"
        : over && onObject(over)
        ? "pointer"
        : "";
    }

    function down(e: PointerEvent) {
      if (systemState === "unfolding" || systemState === "dropped" || systemState === "recovering") return;
      if (drag || e.button > 0 || !e.isPrimary) return;
      const p = at(e);
      hoveredBeacon = findBeacon(p);
      drag = {
        id: e.pointerId,
        x: p[0],
        y: p[1],
        x0: p[0],
        y0: p[1],
        t0: performance.now(),
        touch: e.pointerType === "touch",
        obj: onObject(p),
        moved: false,
        dead: false,
      };
      vel = 0;
      trail.length = 0;
      if (box?.setPointerCapture) {
        try {
          box.setPointerCapture(e.pointerId);
        } catch {}
      }
      cursor();
    }

    function move(e: PointerEvent) {
      const p = at(e);
      if (!drag || e.pointerId !== drag.id) {
        if (!drag && e.pointerType !== "touch") {
          over = p;
          hoveredBeacon = findBeacon(p);
          want[0] = clamp((p[0] / S) * 2 - 1, -1, 1);
          want[1] = clamp((p[1] / S) * 2 - 1, -1, 1);
          cursor();
        }
        return;
      }
      if (drag.dead) return;
      let dx = p[0] - drag.x;
      let dy = p[1] - drag.y;
      drag.x = p[0];
      drag.y = p[1];
      if (!drag.moved) {
        dx = p[0] - drag.x0;
        dy = p[1] - drag.y0;
        if (dx * dx + dy * dy < 36) return;
        if (drag.touch && Math.abs(dy) > Math.abs(dx)) {
          drag.dead = true;
          cursor();
          return;
        }
        drag.moved = true;
        cursor();
      }
      ang += dx / R;
      tilt = clamp(tilt + (dy / R) * 0.5, -0.4, 0.4);
      trail.push(performance.now(), ang);
      if (trail.length > 16) trail.splice(0, 2);
      if (still) {
        turn(0);
        draw(clock);
      }
    }

    function up(e: PointerEvent) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      const now = performance.now();
      const n = trail.length;
      const p = at(e);
      drag = null;
      if (e.type === "pointerup" && !d.dead) {
        if (!d.moved) {
          const clickedBeacon = findBeacon(p);
          if (clickedBeacon !== null) {
            tapAt = now;
            vel = 0;
            const beaconInfo = getBeaconInfo(clickedBeacon);
            onSelectBeaconRef.current?.(beaconInfo);
            return;
          }
          if (d.obj && now - d.t0 < 400) {
            tapAt = now;
            swap();
          }
        } else if (n >= 4 && now - trail[n - 2] < 120 && !still) {
          vel = clamp(
            (trail[n - 1] - trail[1]) / Math.max(1, trail[n - 2] - trail[0]),
            -0.012,
            0.012
          );
        }
      }
      over =
        !d.touch && p[0] >= 0 && p[1] >= 0 && p[0] <= S && p[1] <= S ? p : null;
      hoveredBeacon = over ? findBeacon(over) : null;
      if (!over) want[0] = want[1] = 0;
      cursor();
    }

    function leave(e: PointerEvent) {
      if (drag || e.pointerType === "touch") return;
      over = null;
      hoveredBeacon = null;
      want[0] = want[1] = 0;
      cursor();
    }

    box.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", up);
    box.addEventListener("pointercancel", up);
    box.addEventListener("lostpointercapture", up);
    box.addEventListener("pointerleave", leave);

    if (btn) {
      btn.addEventListener("click", (e) => {
        if (!e.detail && performance.now() - tapAt > 400) swap();
      });
      btn.addEventListener("keydown", (e) => {
        const k = e.key;
        const dir =
          k === "ArrowLeft" || k === "ArrowUp"
            ? -1
            : k === "ArrowRight" || k === "ArrowDown"
            ? 1
            : 0;
        if (!dir) return;
        e.preventDefault();
        if (k === "ArrowUp" || k === "ArrowDown")
          tilt = clamp(tilt + dir * 0.1, -0.4, 0.4);
        else if (still) ang += dir * 0.25;
        else vel = clamp(vel + dir * 0.0012, -0.012, 0.012);
        if (still) {
          turn(0);
          draw(clock);
        }
      });
    }

    /* ---- Clock, resize, and motion ---- */
    let clock = 0;
    let last = 0;
    let raf = 0;
    let still = false;
    let inView = true;

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      if (
        last &&
        now - last <
          (drag && !drag.dead || Math.abs(vel) > 3e-4 ? 8 : 30)
      )
        return;
      const dt = last ? Math.min(now - last, 100) : 0;
      clock += dt;
      last = now;
      if (Math.min(window.devicePixelRatio || 1, 2) !== dpr) fit();
      if (clock >= next) {
        capture(clock);
        next = clock + 1400 + Math.random() * 800;
      }
      // Periodic synaptic brain pulses firing into cables (slower paced, wider intervals)
      if (clock >= nextCablePulse) {
        // Deliberate, solitary pulses with occasional pair
        const count = Math.random() < 0.15 ? 2 : 1;
        for (let c = 0; c < count; c++) {
          const idx = Math.floor(Math.random() * CABLE_ANCHORS.length);
          if (!cablePulses.some((p) => p.cableIdx === idx && clock - p.startT < 2200)) {
            const isGreen = Math.random() < 0.28;
            // Slower travel duration: 1.6 to 2.0 seconds
            const dur = 1600 + Math.random() * 400;
            cablePulses.push({
              cableIdx: idx,
              startT: clock,
              duration: dur,
              g: isGreen,
            });
            // Schedule needle sensor flash when light arrives at sensor
            const head = CABLE_ANCHORS[idx].headIdx;
            events.push({
              v: head,
              t: clock + dur,
              g: isGreen,
            });
          }
        }
        // Slower intervals: fires once every 2.5 to 4.5 seconds
        nextCablePulse = clock + 2500 + Math.random() * 2000;
      }
      cablePulses = cablePulses.filter((p) => clock - p.startT < p.duration + 550);
      events = events.filter((e) => clock - e.t < 700);
      turn(dt);
      if (dt) simulate(dt);
      draw(clock);
    }

    function sync() {
      const run = !still && !document.hidden && inView && S > 0;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function fit() {
      const w = box!.clientWidth;
      S = w > 0 ? w : 0;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(S * dpr);
      if (cv!.width !== px) {
        cv!.width = px;
        cv!.height = px;
      }
      R = S * 0.4;
      C0 = S / 2;
      U = Math.max(0.85, S / 620);
      LW = dpr > 1 ? 0.75 : 1;
    }

    function size() {
      fit();
      if (S) draw(clock);
      sync();
    }

    const mq = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    function motion() {
      still = !!(mq && mq.matches);
      if (still) {
        events = [];
        vel = 0;
        tilt = 0;
        par[0] = par[1] = want[0] = want[1] = 0;
        turn(0);
        if (S) draw(clock);
      }
      sync();
    }

    if (mq) {
      if (mq.addEventListener) mq.addEventListener("change", motion);
    }

    const ro = new ResizeObserver(size);
    ro.observe(box);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(box);

    document.addEventListener("visibilitychange", sync);
    still = !!(mq && mq.matches);
    size();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerup", up);
      box.removeEventListener("pointercancel", up);
      box.removeEventListener("lostpointercapture", up);
      box.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className={`rig select-none ${className || ""}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full touch-pan-y" />
      <button
        ref={buttonRef}
        type="button"
        aria-label="Trade physical simulation object"
        className="absolute left-[31%] top-[31%] w-[38%] h-[38%] rounded-full bg-transparent border-0 cursor-inherit opacity-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--green)]"
      />
    </div>
  );
}
