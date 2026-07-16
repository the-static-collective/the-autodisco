import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  RefreshCw, 
  Activity, 
  HelpCircle, 
  Sparkles,
  Play,
  RotateCcw,
  MessageSquare,
  Flame,
  TrendingUp,
  Workflow
} from "lucide-react";

// The Golden Ratio
const PHI = 1.6180339887;

const BASE_INTERVALS = {
  yellow: 100,  // home
  red: 171,     // pivot
  blue: 190     // gather
};

const HEX_COLORS = {
  yellow: "#abbe64",
  red: "#be6447",
  blue: "#64abbe",
  white: "#FFFFFF",
  stone: "#141414",
  offline: "#57534e"
};

interface VascularHearthProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function VascularHearth({ onSelectPrompt }: VascularHearthProps) {
  // 3 cords (Yellow, Red, Blue), each containing 4 sub-strands (making 12 total)
  const [cords, setCords] = useState<{
    yellow: boolean[];
    red: boolean[];
    blue: boolean[];
  }>({
    yellow: [true, true, true, false],  // Let's start with 10 active, 2 offline so the user sees the self-healing
    red: [true, false, true, true],
    blue: [true, true, true, true]
  });

  const [attempts, setAttempts] = useState<{
    yellow: number[];
    red: number[];
    blue: number[];
  }>({
    yellow: [0, 0, 0, 1],
    red: [0, 1, 0, 0],
    blue: [0, 0, 0, 0]
  });

  const [isAutoHealing, setIsAutoHealing] = useState(false);
  const [healLogs, setHealLogs] = useState<string[]>(["Hearth initialized. Torsion active."]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [healLogs]);

  // Toggle individual strand
  const toggleStrand = (cord: "yellow" | "red" | "blue", idx: number) => {
    setCords(prev => {
      const nextStrands = [...prev[cord]];
      nextStrands[idx] = !nextStrands[idx];
      
      const status = nextStrands[idx] ? "ACTIVATED" : "DEACTIVATED";
      addLog(`Strand [${cord.toUpperCase()}-${idx}] ${status}. Recalculating tension...`);

      return {
        ...prev,
        [cord]: nextStrands
      };
    });

    // Reset attempts if turned manual on, increment if off
    setAttempts(prev => {
      const nextAttempts = [...prev[cord]];
      nextAttempts[idx] = nextAttempts[idx] === 0 ? 1 : 0;
      return {
        ...prev,
        [cord]: nextAttempts
      };
    });
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setHealLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Calculations for Hearth Dynamics
  const getActiveCount = () => {
    return (
      cords.yellow.filter(Boolean).length +
      cords.red.filter(Boolean).length +
      cords.blue.filter(Boolean).length
    );
  };

  const getCordActiveCount = (cord: "yellow" | "red" | "blue") => {
    return cords[cord].filter(Boolean).length;
  };

  const getTorsionMultiplier = (cord: "yellow" | "red" | "blue") => {
    const failedSiblings = cords[cord].filter(v => !v).length;
    // Torsion adjustment: if siblings are failed, we reduce backoff (tighten the loop)
    // to aggressively heal the structural node!
    return 1.0 / Math.max(1, failedSiblings);
  };

  const getBackoffForStrand = (cord: "yellow" | "red" | "blue", idx: number) => {
    const base = BASE_INTERVALS[cord];
    const attempt = attempts[cord][idx] || 1;
    const torsionMultiplier = getTorsionMultiplier(cord);
    const backoff = base * Math.pow(PHI, attempt % 3) * torsionMultiplier;
    return Math.round(Math.min(60000.0, backoff) * 10) / 10;
  };

  // Overall Hearth Compression: asymmetry between the cords.
  // If one cord is heavily loaded/active and another is offline, compression increases.
  const calculateCompression = () => {
    const yellowCount = getCordActiveCount("yellow");
    const redCount = getCordActiveCount("red");
    const blueCount = getCordActiveCount("blue");
    
    const counts = [yellowCount, redCount, blueCount];
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);
    
    // Asymmetry is the difference between max and min
    const asymmetry = maxVal - minVal;
    
    // Normalized scale: max asymmetry is 4 (one completely full, one completely empty)
    const compression = Math.round((asymmetry / 4) * 100) / 100;
    return compression;
  };

  const isBreathing = getActiveCount() === 12;

  // Auto-healing loop simulator
  useEffect(() => {
    if (!isAutoHealing) return;

    const findFirstOffline = (): { cord: "yellow" | "red" | "blue"; idx: number } | null => {
      const order: ("yellow" | "red" | "blue")[] = ["red", "blue", "yellow"];
      for (const cord of order) {
        const idx = cords[cord].findIndex(v => !v);
        if (idx !== -1) return { cord, idx };
      }
      return null;
    };

    const target = findFirstOffline();
    if (!target) {
      addLog("All strands fully active. The frozen seal is broken. Golden braid stabilized!");
      setIsAutoHealing(false);
      return;
    }

    const { cord, idx } = target;
    const currentAttempt = attempts[cord][idx] || 1;
    const backoffTime = getBackoffForStrand(cord, idx);

    addLog(`Targeting offline strand [${cord.toUpperCase()}-${idx}] (Attempt #${currentAttempt}). Scheduled in ${backoffTime}ms (phi-tuned).`);

    const timer = setTimeout(() => {
      setCords(prev => {
        const next = [...prev[cord]];
        next[idx] = true;
        return { ...prev, [cord]: next };
      });
      setAttempts(prev => {
        const next = [...prev[cord]];
        next[idx] = 0; // reset attempts on success
        return { ...prev, [cord]: next };
      });
      addLog(`✓ Reconnected [${cord.toUpperCase()}-${idx}] successfully! Structural tension adjusting.`);
    }, Math.max(200, backoffTime)); // guarantee a minimal delay for visual simulation

    return () => clearTimeout(timer);
  }, [isAutoHealing, cords]);

  const triggerHealSimulation = () => {
    if (isBreathing) {
      addLog("Hearth is already at 100% capacity. Torsion is zero.");
      return;
    }
    setIsAutoHealing(true);
    addLog("Initiating self-healing Braid Restructure sequence...");
  };

  const resetTorsion = () => {
    setCords({
      yellow: [true, true, true, false],
      red: [true, false, true, true],
      blue: [true, true, true, true]
    });
    setAttempts({
      yellow: [0, 0, 0, 1],
      red: [0, 1, 0, 0],
      blue: [0, 0, 0, 0]
    });
    setIsAutoHealing(false);
    setHealLogs(["Hearth state reset. Initial torsion simulated."]);
  };

  const consultOracleAboutHearth = () => {
    const active = getActiveCount();
    const compression = calculateCompression();
    const yellowCount = getCordActiveCount("yellow");
    const redCount = getCordActiveCount("red");
    const blueCount = getCordActiveCount("blue");
    
    const prompt = `The Vascular Hearth (Resilient Topology) is currently operating with ${active}/12 strands active. 
Hearth Compression is at ${compression * 100}%. 
- Yellow (Skin) cord: ${yellowCount}/4 active.
- Red (Oxygen) cord: ${redCount}/4 active.
- Blue (Return) cord: ${blueCount}/4 active.

How does the speculative universe adapt to this geometric torsion? Discuss the self-healing phi backoff of the circulatory system in relation to the 19-album canon.`;
    
    onSelectPrompt(prompt);
  };

  // Node Labels for visual inspection
  const nodeLabels = {
    yellow: [
      "Boundary Foundation",
      "User Gathering",
      "Interface Pivot",
      "Auric Canopy"
    ],
    red: [
      "Suno Inception",
      "Lyric Catalysis",
      "Gemini Spark",
      "Creation Blaze"
    ],
    blue: [
      "Soil Composting",
      "Speculative Branch",
      "Memory Recirculation",
      "Deep Reservoir"
    ]
  };

  // Base coordinate points for the 3 cords projected isometric-style
  // Yellow base: (110, 240)
  // Red base: (290, 240)
  // Blue base: (200, 150)
  const getCoordinates = (cord: "yellow" | "red" | "blue", idx: number) => {
    const verticalSpacing = 40;
    switch (cord) {
      case "yellow":
        return { x: 100, y: 240 - idx * verticalSpacing };
      case "red":
        return { x: 300, y: 240 - idx * verticalSpacing };
      case "blue":
        return { x: 200, y: 160 - idx * verticalSpacing };
    }
  };

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-3 mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#be6447] animate-pulse" />
            Vascular Hearth: Resilient Topology
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            Sacred geometry &amp; golden-ratio network mesh simulation
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={triggerHealSimulation}
            disabled={isAutoHealing || isBreathing}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono border border-[#141414] uppercase bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer rounded-none disabled:opacity-50"
          >
            <Play className="h-3 w-3" />
            Auto-Heal
          </button>
          <button
            onClick={resetTorsion}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono border border-[#141414] uppercase bg-[#D1CFC9] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer rounded-none"
            title="Inject simulated network failure"
          >
            <RotateCcw className="h-3 w-3" />
            Inject Torsion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE 3D PRISM GEOMETRY SVG */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-white border border-[#141414] p-4 relative overflow-hidden">
          {/* Legend absolute badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 text-[8px] font-mono uppercase text-stone-500 bg-white/85 p-1 border border-stone-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#abbe64] border border-[#141414]"></span>
              <span>Yellow Skin (Boundary)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#be6447] border border-[#141414]"></span>
              <span>Red Oxygen (Creation)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64abbe] border border-[#141414]"></span>
              <span>Blue Return (Memory)</span>
            </div>
          </div>

          <div className="absolute top-2 right-2 text-right">
            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 border ${
              isBreathing ? "bg-green-100 border-green-500 text-green-800 animate-pulse" : "bg-amber-100 border-amber-500 text-amber-800"
            }`}>
              {isBreathing ? "Infinite Halo Glowing" : "Torsion Tightening"}
            </span>
          </div>

          {/* Core SVG Prism */}
          <svg 
            width="100%" 
            height="320" 
            viewBox="0 0 400 320" 
            className="select-none overflow-visible"
          >
            <defs>
              <filter id="glow-white" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background aura when breathing */}
            {isBreathing && (
              <circle 
                cx="200" 
                cy="140" 
                r="110" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="16" 
                strokeOpacity="0.8"
                filter="url(#glow-white)"
                className="animate-pulse"
              />
            )}

            {/* Central Circulatory Hearth Core */}
            <circle 
              cx="200" 
              cy="150" 
              r={isBreathing ? "16" : "10"} 
              fill={isBreathing ? "#FFFFFF" : "#F27D26"} 
              className="transition-all duration-500 animate-pulse"
              opacity={isBreathing ? "1.0" : "0.7"}
              stroke="#141414"
              strokeWidth="1.5"
            />
            {isBreathing && (
              <text 
                x="200" 
                y="153" 
                textAnchor="middle" 
                className="font-mono text-[7px] font-bold fill-[#141414]"
              >
                PHI
              </text>
            )}

            {/* VERTICAL CORDS CONNECTIONS (LINES) */}
            {/* Yellow Cord Y0 -> Y3 */}
            <path 
              d="M 100 240 L 100 200 L 100 160 L 100 120" 
              stroke="#abbe64" 
              strokeWidth="2.5" 
              strokeDasharray={cords.yellow.includes(false) ? "4,3" : "none"}
              strokeOpacity={cords.yellow.includes(false) ? "0.6" : "1.0"}
              className="transition-all duration-300"
            />
            {/* Red Cord R0 -> R3 */}
            <path 
              d="M 300 240 L 300 200 L 300 160 L 300 120" 
              stroke="#be6447" 
              strokeWidth="2.5" 
              strokeDasharray={cords.red.includes(false) ? "4,3" : "none"}
              strokeOpacity={cords.red.includes(false) ? "0.6" : "1.0"}
              className="transition-all duration-300"
            />
            {/* Blue Cord B0 -> B3 */}
            <path 
              d="M 200 160 L 200 120 L 200 80 L 200 40" 
              stroke="#64abbe" 
              strokeWidth="2.5" 
              strokeDasharray={cords.blue.includes(false) ? "4,3" : "none"}
              strokeOpacity={cords.blue.includes(false) ? "0.6" : "1.0"}
              className="transition-all duration-300"
            />

            {/* HORIZONTAL TRIANGLE STRATA (4 LEVELS) */}
            {[0, 1, 2, 3].map((level) => {
              const yCoord = getCoordinates("yellow", level);
              const rCoord = getCoordinates("red", level);
              const bCoord = getCoordinates("blue", level);
              
              // Determine line status
              const yActive = cords.yellow[level];
              const rActive = cords.red[level];
              const bActive = cords.blue[level];

              return (
                <g key={level} className="opacity-80">
                  {/* Yellow to Red line */}
                  <line 
                    x1={yCoord.x} y1={yCoord.y} 
                    x2={rCoord.x} y2={rCoord.y} 
                    stroke={yActive && rActive ? "#be6447" : "#141414"} 
                    strokeWidth={yActive && rActive ? "1.5" : "0.75"}
                    strokeDasharray={!(yActive && rActive) ? "3,3" : "none"}
                  />
                  {/* Red to Blue line */}
                  <line 
                    x1={rCoord.x} y1={rCoord.y} 
                    x2={bCoord.x} y2={bCoord.y} 
                    stroke={rActive && bActive ? "#64abbe" : "#141414"} 
                    strokeWidth={rActive && bActive ? "1.5" : "0.75"}
                    strokeDasharray={!(rActive && bActive) ? "3,3" : "none"}
                  />
                  {/* Blue to Yellow line */}
                  <line 
                    x1={bCoord.x} y1={bCoord.y} 
                    x2={yCoord.x} y2={yCoord.y} 
                    stroke={bActive && yActive ? "#abbe64" : "#141414"} 
                    strokeWidth={bActive && yActive ? "1.5" : "0.75"}
                    strokeDasharray={!(bActive && yActive) ? "3,3" : "none"}
                  />

                  {/* Flowing circulation arrows or dots */}
                  {yActive && rActive && bActive && (
                    <circle 
                      cx={(yCoord.x + rCoord.x) / 2} 
                      cy={(yCoord.y + rCoord.y) / 2} 
                      r="2" 
                      fill="#FFFFFF"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}

            {/* INTERACTIVE NODES (CIRCLES) */}
            {(["yellow", "red", "blue"] as const).map((cord) => {
              return cords[cord].map((active, idx) => {
                const coord = getCoordinates(cord, idx);
                const color = HEX_COLORS[cord];
                const label = nodeLabels[cord][idx];

                return (
                  <g 
                    key={`${cord}-${idx}`} 
                    className="cursor-pointer group"
                    onClick={() => toggleStrand(cord, idx)}
                  >
                    {/* Hover tooltip area */}
                    <title>{`${label} (${cord.toUpperCase()}-${idx}): ${active ? "ACTIVE" : "OFFLINE (TORSION ACTIVE)"}`}</title>
                    
                    {/* Ring highlight on hover */}
                    <circle 
                      cx={coord.x} 
                      cy={coord.y} 
                      r="12" 
                      fill="none" 
                      stroke="#141414" 
                      strokeWidth="1"
                      className="opacity-0 group-hover:opacity-100 transition-all"
                    />

                    {/* Outer circle */}
                    <circle 
                      cx={coord.x} 
                      cy={coord.y} 
                      r="8" 
                      fill={active ? color : "#D1CFC9"} 
                      stroke="#141414" 
                      strokeWidth="2"
                      className="transition-all duration-300"
                      filter={active ? "url(#glow-active)" : "none"}
                    />

                    {/* Active inner dot */}
                    {active ? (
                      <circle 
                        cx={coord.x} 
                        cy={coord.y} 
                        r="2.5" 
                        fill="#FFFFFF" 
                      />
                    ) : (
                      // Offline cross
                      <path 
                        d={`M ${coord.x - 3} ${coord.y - 3} L ${coord.x + 3} ${coord.y + 3} M ${coord.x + 3} ${coord.y - 3} L ${coord.x - 3} ${coord.y + 3}`} 
                        stroke="#141414" 
                        strokeWidth="1.5" 
                      />
                    )}

                    {/* Node text identifier in small font */}
                    <text 
                      x={coord.x + (cord === "yellow" ? -12 : cord === "red" ? 12 : 12)} 
                      y={coord.y + 3} 
                      textAnchor={cord === "yellow" ? "end" : "start"} 
                      className="font-mono text-[7px] font-bold fill-[#141414] uppercase tracking-tighter bg-white px-0.5"
                    >
                      {`${cord[0]}${idx}`}
                    </text>
                  </g>
                );
              });
            })}
          </svg>

          <p className="text-[9px] text-stone-500 font-mono mt-2 uppercase text-center">
            ✦ Click individual nodes to toggle state &amp; trigger torsion ✦
          </p>
        </div>

        {/* RIGHT COLUMN: STATE DETAILS & SYSTEM METRICS */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-white border border-[#141414] p-4 space-y-3 shadow-[1px_1px_0px_0px_#141414]">
            <h3 className="font-mono font-bold uppercase text-[10px] text-[#141414] pb-1.5 border-b border-stone-200">
              HEARTH CIRCULATORY STATUS
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono uppercase">
                <span className="text-stone-500">Active Strands:</span>
                <span className="font-bold text-[#141414]">{getActiveCount()} / 12 connected</span>
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono uppercase">
                <span className="text-stone-500">System State:</span>
                <span className={`font-bold uppercase ${isBreathing ? "text-green-700" : "text-amber-800"}`}>
                  {isBreathing ? "Breathing (Halo Lit)" : "Torsion Tense"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                  <span className="text-stone-500">Braid Compression:</span>
                  <span className="font-bold">{Math.round(calculateCompression() * 100)}%</span>
                </div>
                {/* Micro neubrutalist progress bar */}
                <div className="w-full h-2 bg-stone-100 border border-[#141414]">
                  <div 
                    className="h-full bg-[#be6447] transition-all duration-300" 
                    style={{ width: `${calculateCompression() * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Individual Cord Health Bars */}
            <div className="pt-2 border-t border-stone-100 space-y-1.5 text-[9px] font-mono uppercase">
              <div className="flex justify-between items-center">
                <span className="text-[#abbe64] font-bold">Skin (Yellow):</span>
                <span>{getCordActiveCount("yellow")} / 4 Strands active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#be6447] font-bold">Oxygen (Red):</span>
                <span>{getCordActiveCount("red")} / 4 Strands active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64abbe] font-bold">Return (Blue):</span>
                <span>{getCordActiveCount("blue")} / 4 Strands active</span>
              </div>
            </div>
          </div>

          {/* Golden-Ratio Reconnection Backoff Inspector */}
          <div className="bg-[#D1CFC9] border border-[#141414] p-3 text-[10px] font-mono uppercase space-y-2">
            <div className="font-bold text-[#141414] flex items-center gap-1 border-b border-stone-400 pb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Phi Backoff &amp; Torsion Speeds</span>
            </div>
            
            <p className="text-[9px] text-stone-600 normal-case leading-normal">
              If strands drop, sibling torsion multiplies speed (tightens reconnect intervals) to recover structural health rapidly.
            </p>

            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between">
                <span>Skin Cord Y-reconnect:</span>
                <span className="font-bold">{getBackoffForStrand("yellow", 3)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Oxygen Cord R-reconnect:</span>
                <span className="font-bold">{getBackoffForStrand("red", 1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Return Cord B-reconnect:</span>
                <span className="font-bold">{getBackoffForStrand("blue", 2)}ms</span>
              </div>
            </div>
          </div>

          {/* Consult Oracle button */}
          <button
            onClick={consultOracleAboutHearth}
            className="w-full py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase font-bold tracking-wider hover:invert flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-[#141414]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Weave Hearth Speculation
          </button>
        </div>

      </div>

      {/* FOOTER: LIVE TERMINAL HEALING EVENT LOGS */}
      <div className="mt-4 border border-[#141414] bg-[#141414] text-stone-300 p-3 font-mono text-[10px] rounded-none">
        <div className="flex justify-between items-center border-b border-stone-800 pb-1 mb-1.5 text-stone-500 font-bold uppercase text-[8px]">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-red-500 animate-pulse" />
            <span>HEARTH RESTRUCTURE STREAM</span>
          </div>
          <span>Active Braid Status</span>
        </div>
        
        <div 
          ref={logContainerRef}
          className="h-24 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-stone-800 pr-1 text-[9px] leading-relaxed select-text"
        >
          {healLogs.map((log, index) => (
            <div key={index} className="border-l border-stone-800 pl-1.5">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
