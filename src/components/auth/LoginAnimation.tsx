'use client';

import React, { useEffect, useState } from 'react';

/**
 * LoginAnimation Component
 *
 * "Active Threat Response System"
 * - Visualization: Holographic map of infrastructure.
 * - Narrative: System detects an issue (Red), Auto-remediates (Beam), and Resolves (Green).
 * - Aesthetic: Premium, glassmorphic, incident-focused.
 */
export default function LoginAnimation() {
  const [mounted, setMounted] = useState(false);
  const [activeIncident, setActiveIncident] = useState<number | null>(null); // Index of node having incident
  const [isFixing, setIsFixing] = useState(false); // Beam active
  const [nodes, setNodes] = useState([
    { id: 0, label: 'API_GATEWAY', angle: 0, status: 'healthy', radius: 140 },
    { id: 1, label: 'AUTH_SERVICE', angle: 72, status: 'healthy', radius: 140 },
    { id: 2, label: 'DB_PRIMARY', angle: 144, status: 'healthy', radius: 140 },
    { id: 3, label: 'PAYMENTS', angle: 216, status: 'healthy', radius: 140 },
    { id: 4, label: 'WORKERS', angle: 288, status: 'healthy', radius: 140 },
  ]);

  useEffect(() => {
    setMounted(true);

    // Simulation Loop
    const interval = setInterval(() => {
      // Randomly pick a node to "fail"
      const victimIdx = Math.floor(Math.random() * 5);
      setActiveIncident(victimIdx);

      // 1. Trigger Incident
      setNodes(prev => prev.map((n, i) => (i === victimIdx ? { ...n, status: 'critical' } : n)));

      // 2. Start Fixing (Visual Beam) after 1s
      setTimeout(() => {
        setIsFixing(true);
      }, 1000);

      // 3. Resolve Incident after 2.5s
      setTimeout(() => {
        setNodes(prev => prev.map((n, i) => (i === victimIdx ? { ...n, status: 'healthy' } : n)));
        setIsFixing(false);
        setActiveIncident(null);
      }, 2500);
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />

      {/* Central Connectivity Mesh */}
      <div className="relative h-[400px] w-[400px] flex items-center justify-center">
        {/* Rotating Hexagon Field */}
        <div className="absolute inset-0 animate-[spin_60s_linear_infinite] opacity-20">
          <svg viewBox="0 0 400 400" className="h-full w-full">
            <circle
              cx="200"
              cy="200"
              r="140"
              className="fill-none stroke-cyan-500/30 stroke-dashed"
            />
            <circle cx="200" cy="200" r="190" className="fill-none stroke-cyan-500/10" />
          </svg>
        </div>

        {/* The Core: Sentinel Eye */}
        <div className="z-20 flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div
            className={`h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] transition-all duration-300 ${activeIncident !== null ? 'bg-rose-500 shadow-rose-500 scale-125 animate-ping' : ''}`}
          />
          {/* Scanning Beam */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(6,182,212,0.2)_360deg)]" />
        </div>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <ServiceNode
            key={node.id}
            {...node}
            isTarget={activeIncident === i}
            isFixing={isFixing && activeIncident === i}
          />
        ))}
      </div>

      {/* Terminal Status */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="glass-panel px-4 py-2 rounded-full border border-white/10 bg-black/20 backdrop-blur-md flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${activeIncident !== null ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
          />
          <span className="text-[10px] font-mono tracking-widest text-white/80 uppercase">
            {activeIncident !== null
              ? `INCIDENT DETECTED: ${nodes[activeIncident].label}`
              : 'SYSTEM SECURE • MONITORING ACTIVE'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ServiceNode({ label, angle, status, radius, isTarget, isFixing }: any) {
  // Calculate Position (Fixed Angle)
  // We strictly position them using styles to avoid rotation issues
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius; // Center is 0,0 relative to container
  const y = Math.sin(rad) * radius;

  // Status Styles
  const isCrit = status === 'critical';
  const colorClass = isCrit
    ? 'border-rose-500 bg-rose-500/10 text-rose-200 shadow-rose-900/50'
    : 'border-cyan-500/30 bg-slate-950/80 text-cyan-200 shadow-cyan-900/20';
  const dotColor = isCrit ? 'bg-rose-500' : 'bg-cyan-400';

  return (
    <>
      {/* Connection Line to Center */}
      {isFixing && (
        <div
          className="absolute top-1/2 left-1/2 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent origin-left z-0 animate-pulse"
          style={{
            width: `${radius}px`,
            transform: `rotate(${angle}deg)`,
            marginTop: '-1px',
          }}
        />
      )}

      {/* The Node */}
      <div
        className={`absolute z-10 flex flex-col items-center justify-center transition-all duration-500`}
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        }}
      >
        <div
          className={`relative flex items-center gap-2 rounded-lg border px-3 py-1.5 backdrop-blur-md shadow-lg transition-colors duration-300 ${colorClass}`}
        >
          <div
            className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${dotColor} ${isCrit ? 'animate-ping' : ''}`}
          />
          <span className="text-[9px] font-bold tracking-wider">{label}</span>

          {/* Active Mitigation Badge */}
          {isFixing && (
            <div className="absolute -top-3 -right-2 px-1.5 py-0.5 bg-emerald-500 text-[8px] text-black font-bold rounded animate-bounce">
              FIXING
            </div>
          )}
        </div>
      </div>
    </>
  );
}
