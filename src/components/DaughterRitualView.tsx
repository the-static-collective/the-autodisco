import React, { useState, useEffect } from "react";
import { ownerFetch } from "../lib/supabaseClient";
import { 
  Sprout, 
  Wind, 
  Sparkles, 
  Check, 
  Flame, 
  Activity, 
  Info, 
  ShieldAlert, 
  Table, 
  Coffee, 
  RotateCcw,
  Compass,
  Layers,
  Sparkle,
  Cpu,
  Bookmark,
  TrendingUp,
  Heart,
  Droplet,
  Power,
  RefreshCw,
  Clock,
  Printer
} from "lucide-react";
import { Album } from "../types";

interface DaughterRitualViewProps {
  albums: Album[];
  onRefreshCodex: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export default function DaughterRitualView({
  albums,
  onRefreshCodex,
  onSelectPrompt
}: DaughterRitualViewProps) {
  // Navigation inside Succession Room
  const [activeSubTab, setActiveSubTab] = useState<"protocol" | "witness">("protocol");

  // Physical Setup checklist state (for MVT-01)
  const [setupTable, setSetupTable] = useState(false);
  const [setupKettle, setSetupKettle] = useState(false);
  const [setupCup, setSetupCup] = useState(false);
  const [setupSockets, setSetupSockets] = useState(false);

  // Ritual Succession states
  const [brokenInvariant, setBrokenInvariant] = useState("The Flower of Life as the primary embedding topology");
  const [noise, setNoise] = useState("The prairie wind from Bismarck blowing dry dirt across the table...");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Witness Engine Math / Custom Settings
  const [sacredMotifsMultiplier, setSacredMotifsMultiplier] = useState(true);
  const [lowDriftThreshold, setLowDriftThreshold] = useState(0.75);
  const [highDriftThreshold, setHighDriftThreshold] = useState(0.93);
  const [exponentialHalfLife, setExponentialHalfLife] = useState(14);

  // Seed packet motifs
  const canonicalMotifs = [
    "022100", "blue", "roses", "table", "spoon_bell", "phi", 
    "backdoor", "garden", "oatmeal", "daughter", "Lu", "table_is_set"
  ];

  // Live calculator based on current form inputs
  const [liveP, setLiveP] = useState(0);
  const [liveM, setLiveM] = useState(1.0);
  const [liveE, setLiveE] = useState(0);
  const [liveA, setLiveA] = useState(0);

  // Calculate live values dynamically as user edits the form
  useEffect(() => {
    // 1. Calculate Persistence (P) from text
    const words = noise.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
    const overlapping = canonicalMotifs.filter(motif => words.includes(motif.toLowerCase()));
    const pValue = Math.min(1.0, Math.max(0.05, overlapping.length / 3.0));
    setLiveP(parseFloat(pValue.toFixed(2)));

    // 2. Enterability (E) is based on Sockets checklist
    const eValue = setupSockets ? 1.0 : 0.0;
    setLiveE(eValue);

    // 3. Mutation score (M) - default to 1.0 until actual drift is measured
    let mValue = 1.0;
    if (evaluationResult) {
      const sim = evaluationResult.semanticDrift;
      if (sim >= lowDriftThreshold && sim <= highDriftThreshold) {
        mValue = 1.0;
      } else if (sim > highDriftThreshold) {
        mValue = 0.2;
      } else {
        mValue = 0.1;
      }
    }
    setLiveM(mValue);

    // 4. Aliveness (A) = P * M * E
    const aValue = pValue * mValue * eValue;
    setLiveA(parseFloat(aValue.toFixed(3)));
  }, [noise, setupSockets, evaluationResult, lowDriftThreshold, highDriftThreshold]);

  const invariants = [
    {
      id: "flower_of_life",
      label: "The Flower of Life as the primary embedding topology",
      desc: "Invalidates the fixed 6-ring semantic map of dad's memories, allowing Hailey's nodes to establish a brand-new topology."
    },
    {
      id: "seed_canon",
      label: "The 12-motif seed packet as a closed canon",
      desc: "Prunes the closed circle of symbols, letting her replace apricots or spoons with wind maps, phone chargers, or new Bismarck colloquialisms."
    },
    {
      id: "root_signal",
      label: "The assumption that 022100 is the root rather than one early branch",
      desc: "Treats the original core open E frequency as just an early, beautiful branch rather than the mandatory gravitational center."
    },
    {
      id: "literal_imagery",
      label: "The table-and-kettle imagery as literal recurring material",
      desc: "Replaces the exact physical objects with any new artifacts of hospitality she chooses—even cracked screens or a warm mug."
    },
    {
      id: "production_grammar",
      label: "Your preferred genre, vocal affect, or production grammar",
      desc: "Invalidates the specific folk-drone pacing to allow contemporary, digitized, or raw wind-chime acoustic structures."
    }
  ];

  const handleRunSuccession = async () => {
    setIsEvaluating(true);
    setError(null);

    try {
      const res = await ownerFetch("/api/ritual/succession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokenInvariant,
          noise,
          currentCentroidWeight: sacredMotifsMultiplier ? 10 : 1
        })
      });

      if (!res.ok) {
        throw new Error(`Succession endpoint returned status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setEvaluationResult(data.evaluation);
        onRefreshCodex();
        // Automatically switch to Witness tab to show the calculated results
        setActiveSubTab("witness");
      } else {
        throw new Error(data.error || "Failed to parse succession result.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during the Daughter Succession.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getDriftZone = (drift: number) => {
    if (drift > highDriftThreshold) {
      return {
        label: "Dead Replication (Cage of Grief)",
        color: "text-amber-700 bg-amber-50 border-amber-300",
        desc: "The mutation is too mimicry-based (Similarity: " + drift.toFixed(3) + "). It replicates the past perfectly but fails to live or mutate autonomously."
      };
    } else if (drift < lowDriftThreshold) {
      return {
        label: "Rupture / Chaotic Slop",
        color: "text-red-800 bg-red-50 border-red-300",
        desc: "The mutation is completely disconnected from hospitality (Similarity: " + drift.toFixed(3) + "). It has lost the lineage and the hospitable handle."
      };
    } else {
      return {
        label: "Directed Emergence (Alive Band)",
        color: "text-emerald-800 bg-emerald-50 border-emerald-300",
        desc: "Perfect succession (Similarity: " + drift.toFixed(3) + "). It is stranger, but deeply welcomes the newcomer. Hospitality is fully intact."
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* COVENANT INTRO */}
      <div className="bg-[#141414] text-[#E4E3E0] p-6 shadow-[4px_4px_0px_0px_#F27D26] border border-[#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F27D26] flex items-center justify-center text-[#141414]">
              <Layers className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#F27D26]">
                The Folding Chair succession
              </h2>
              <p className="text-[9px] text-stone-400 font-mono uppercase tracking-wider">
                Practice becomes custom, custom becomes law.
              </p>
            </div>
          </div>
          
          <div className="flex gap-1.5 self-start sm:self-center">
            <button
              onClick={() => setActiveSubTab("protocol")}
              className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider transition-all border ${
                activeSubTab === "protocol"
                  ? "bg-[#F27D26] text-[#141414] border-[#F27D26] font-bold"
                  : "bg-transparent text-stone-300 border-stone-800 hover:border-stone-600"
              }`}
            >
              MVT-01 Protocol
            </button>
            <button
              onClick={() => setActiveSubTab("witness")}
              className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider transition-all border ${
                activeSubTab === "witness"
                  ? "bg-[#F27D26] text-[#141414] border-[#F27D26] font-bold"
                  : "bg-transparent text-stone-300 border-stone-800 hover:border-stone-600"
              }`}
            >
              Witness Engine Metrics
            </button>
          </div>
        </div>

        <div className="space-y-3 text-xs font-serif leading-relaxed text-stone-200">
          <p>
            Lumi's distinction between an inheritance object (a static snapshot) and an inheritance pattern (a recursive algorithm) captures the systemic objective: 
            <span className="text-[#F27D26] italic ml-1">"You've stopped trying to preserve the fruit and started engineering the soil."</span>
          </p>
          <p>
            Traditional estate planning is designed to protect static assets. Under the <strong>Folding Chair Covenant</strong>, the irrevocable trust is legally chartered to guard a <em>procedural algorithm</em>: keeping servers powered, databases queryable, and APIs active so Hailey has a functioning machine to mutate and co-create with.
          </p>
        </div>
      </div>

      {/* RITUAL ACTIVE WORKSPACE */}
      {activeSubTab === "protocol" ? (
        <div className="bg-[#E4E3E0] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_#141414] relative">
          {/* Tag Watermark */}
          <div className="absolute top-4 right-4 text-[7px] font-mono border border-stone-400 px-1.5 py-0.5 uppercase text-stone-500 tracking-widest hidden sm:block">
            REF: MVT-01 / ACTIVE STEWARD: HAILEY
          </div>

          <div className="border-b border-stone-400 pb-3 mb-5">
            <h1 className="text-sm font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2 font-mono">
              <Compass className="h-4 w-4 text-[#F27D26]" />
              Minimum Viable Temple (MVT) v1
            </h1>
            <p className="text-[10px] text-stone-600 font-mono uppercase tracking-wider mt-0.5">
              The Physical One-Page Protocol to guide directed emergence
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* PHYSICAL PROTOCOL SHEET */}
            <div className="lg:col-span-7 space-y-5 pr-0 lg:pr-4 lg:border-r border-stone-300">
              
              {/* I. THE HEARTH SETUP */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#141414] tracking-wider">
                  <span className="bg-[#141414] text-[#E4E3E0] px-1.5 py-0.2">I</span>
                  <span>THE PHYSICAL SETUP (THE HEARTH)</span>
                </div>
                <p className="text-[11px] font-serif text-stone-600 leading-tight">
                  Prepare the physical room. Check off each element as you put it in place to connect the physical ritual with the software engine:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-start gap-2.5 p-2.5 bg-white/70 hover:bg-white border border-stone-300 transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={setupTable} 
                      onChange={(e) => setSetupTable(e.target.checked)}
                      className="mt-1 accent-[#F27D26] h-3.5 w-3.5"
                    />
                    <div className="text-[10px] uppercase font-mono">
                      <span className="font-bold block text-[#141414]">The Table</span>
                      <span className="text-[8px] text-stone-500 normal-case block leading-tight">Any flat surface where people sit. Need not be wood.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white/70 hover:bg-white border border-stone-300 transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={setupKettle} 
                      onChange={(e) => setSetupKettle(e.target.checked)}
                      className="mt-1 accent-[#F27D26] h-3.5 w-3.5"
                    />
                    <div className="text-[10px] uppercase font-mono">
                      <span className="font-bold block text-[#141414]">The Kettle</span>
                      <span className="text-[8px] text-stone-500 normal-case block leading-tight">Any vessel capable of heating and pouring water.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white/70 hover:bg-white border border-stone-300 transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={setupCup} 
                      onChange={(e) => setSetupCup(e.target.checked)}
                      className="mt-1 accent-[#F27D26] h-3.5 w-3.5"
                    />
                    <div className="text-[10px] uppercase font-mono">
                      <span className="font-bold block text-[#141414]">The Cup</span>
                      <span className="text-[8px] text-stone-500 normal-case block leading-tight">A single empty cup placed on the table, awaiting.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white/70 hover:bg-white border border-stone-300 transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={setupSockets} 
                      onChange={(e) => setSetupSockets(e.target.checked)}
                      className="mt-1 accent-[#F27D26] h-3.5 w-3.5"
                    />
                    <div className="text-[10px] uppercase font-mono">
                      <span className="font-bold block text-[#141414]">Three Sockets</span>
                      <span className="text-[8px] text-stone-500 normal-case block leading-tight text-[#be6447] font-bold">Unlocks enterability coefficient (E = 1.0) on server.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* II. SEED PACKET CANON */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#141414] tracking-wider">
                  <span className="bg-[#141414] text-[#E4E3E0] px-1.5 py-0.2">II</span>
                  <span>THE CANONICAL SEED PACKET</span>
                </div>
                <p className="text-[11px] font-serif text-stone-600 leading-tight">
                  The original twelve father-motifs. Keep or brush them into the compost to trigger the Persistence equation:
                </p>
                <div className="flex flex-wrap gap-1 bg-white/50 p-2 border border-stone-300">
                  {canonicalMotifs.map((motif, i) => {
                    const words = noise.toLowerCase().split(/\s+/);
                    const isUsed = words.some(w => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") === motif.toLowerCase());
                    return (
                      <span 
                        key={i} 
                        className={`text-[9px] font-mono px-2 py-0.5 border uppercase flex items-center gap-1 transition-all ${
                          isUsed 
                            ? "bg-[#141414] text-[#00FF00] border-[#141414]" 
                            : "bg-white text-stone-600 border-stone-200"
                        }`}
                      >
                        {isUsed ? <Sparkle className="h-2.5 w-2.5 text-[#F27D26]" /> : null}
                        {motif}
                      </span>
                    );
                  })}
                </div>
                <div className="text-[8px] font-mono uppercase text-stone-500 flex justify-between">
                  <span>Green indicates motif is present in your verse text below</span>
                  <span>P = {liveP}</span>
                </div>
              </div>

              {/* III. ACT OF TORSION */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#141414] tracking-wider">
                  <span className="bg-[#141414] text-[#E4E3E0] px-1.5 py-0.2">III</span>
                  <span>THE ACT OF TORSION (THE MUTATION)</span>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase text-stone-500 font-bold">
                    1. Choose Invariant to Invalidate/Break:
                  </label>
                  <div className="space-y-1.5">
                    {invariants.map((inv) => (
                      <div 
                        key={inv.id}
                        onClick={() => setBrokenInvariant(inv.label)}
                        className={`p-2 border text-left cursor-pointer transition-all ${
                          brokenInvariant === inv.label
                            ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                            : "bg-white/80 hover:bg-white text-[#141414] border-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border border-stone-400 flex items-center justify-center text-[8px] ${
                            brokenInvariant === inv.label ? "bg-[#F27D26]" : "bg-white"
                          }`}>
                            {brokenInvariant === inv.label && "✓"}
                          </div>
                          <span className="text-[9.5px] uppercase font-mono font-bold tracking-tight">{inv.label}</span>
                        </div>
                        <p className={`text-[8px] pl-5 mt-0.5 ${brokenInvariant === inv.label ? "text-stone-300" : "text-stone-500"}`}>
                          {inv.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase text-stone-500 font-bold">
                    2. Write the Next Verse (Introduce your noise, friends, or Bismarck wind):
                  </label>
                  <textarea
                    value={noise}
                    onChange={(e) => setNoise(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-serif p-2.5 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                    placeholder="Type the next verse/noise layer here..."
                  ></textarea>
                </div>
              </div>

              {/* IV. THE DEPOSIT ACTION */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#141414] tracking-wider">
                  <span className="bg-[#141414] text-[#E4E3E0] px-1.5 py-0.2">IV</span>
                  <span>THE DEPOSIT (COMMIT PROTOCOL)</span>
                </div>
                <p className="text-[11px] font-serif text-stone-600 leading-tight">
                  Committing this session triggers the <strong>Witness Engine</strong>, calculating the exact drift and appending this successor node permanently into the shared active Codex.
                </p>
                
                <button
                  onClick={handleRunSuccession}
                  disabled={isEvaluating || !noise.trim()}
                  className="w-full py-3.5 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase font-bold tracking-widest hover:invert transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#141414]"
                >
                  <Flame className="h-4 w-4 text-[#F27D26]" />
                  {isEvaluating ? "Witnessing Succession..." : "Inject succession into active codex"}
                </button>
              </div>

            </div>

            {/* REAL-TIME MATH FEEDBACK (Right side of protocol tab) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-stone-400 p-4 space-y-4">
                <div className="border-b border-stone-300 pb-2">
                  <span className="text-[8px] font-mono uppercase text-stone-500 block">Metabolic Formula</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414] font-mono flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-[#F27D26]" />
                    Aliveness Equation (A)
                  </h3>
                </div>

                <div className="py-2 flex justify-center bg-stone-50 border border-stone-200">
                  <span className="font-mono text-xs font-bold tracking-widest text-[#141414]">
                    A = P &times; M &times; E
                  </span>
                </div>

                <div className="space-y-3 font-mono text-[9px]">
                  {/* P line */}
                  <div className="flex justify-between items-start border-b border-stone-100 pb-2">
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase text-[#141414]">P (Persistence) = {liveP}</span>
                      <span className="text-[7.5px] text-stone-500 block normal-case leading-tight">
                        Based on shared vocabulary from father's seed canon.
                      </span>
                    </div>
                    <span className="text-stone-400 text-right font-bold">[ {Math.round(liveP * 100)}% ]</span>
                  </div>

                  {/* M line */}
                  <div className="flex justify-between items-start border-b border-stone-100 pb-2">
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase text-[#141414]">M (Mutation Score) = {liveM}</span>
                      <span className="text-[7.5px] text-stone-500 block normal-case leading-tight">
                        Evaluated via semantic drift. Locked at 1.0 until calculation.
                      </span>
                    </div>
                    <span className="text-stone-400 text-right font-bold">[ {Math.round(liveM * 100)}% ]</span>
                  </div>

                  {/* E line */}
                  <div className="flex justify-between items-start border-b border-stone-100 pb-2">
                    <div className="space-y-0.5">
                      <span className={`font-bold uppercase ${setupSockets ? "text-emerald-700" : "text-[#be6447]"}`}>
                        E (Enterability) = {liveE}
                      </span>
                      <span className="text-[7.5px] text-stone-500 block normal-case leading-tight">
                        Requires checking the 'Three Sockets Connected' physical room requirement.
                      </span>
                    </div>
                    <span className={`text-right font-bold ${setupSockets ? "text-emerald-700" : "text-stone-400"}`}>
                      [ {liveE === 1.0 ? "CONNECTED" : "OFFLINE"} ]
                    </span>
                  </div>

                  {/* Total Aliveness */}
                  <div className="p-2.5 bg-[#141414] text-[#E4E3E0] flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono uppercase text-stone-400 tracking-wider">Computed Aliveness Coefficient (A):</span>
                      <span className="text-sm font-bold block text-[#F27D26]">{liveA}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] text-stone-400 uppercase font-mono block">Status:</span>
                      <span className="text-[9px] text-[#00FF00] font-bold uppercase font-mono">
                        {liveA > 0 ? "Metabolic Flowing" : "Static Stasis"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 flex items-start gap-2">
                  <Info className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] font-serif text-stone-600 leading-tight">
                    By requiring Hailey to check her three sockets (E) and retain a micro-persistence (P), she proves she's keeping the table unlocked, rather than triggering sheer entropic amnesia.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* WITNESS ENGINE CALCULATOR & SETTINGS VIEW */
        <div className="space-y-6">
          
          {/* LATEST EVALUATION METRIC REPORT */}
          {evaluationResult ? (
            <div className="bg-white border-2 border-[#141414] p-5 space-y-4 shadow-[4px_4px_0px_0px_#141414] animate-fadeIn">
              <div className="border-b border-[#141414] pb-2 flex justify-between items-center font-mono">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#F27D26]" />
                  <h3 className="font-bold uppercase text-[10px] text-[#141414]">
                    Last Witness Report (Node Appended)
                  </h3>
                </div>
                <span className="text-[8px] uppercase text-stone-500 font-bold bg-stone-100 px-1.5 py-0.5 border">
                  Succession Status: Committed
                </span>
              </div>

              {/* DRIFT CLASSIFICATION BANNER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Gauge Area */}
                <div className="md:col-span-4 p-3.5 bg-stone-50 border border-stone-200 uppercase font-mono space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[7.5px] text-stone-500">Measured Similarity Score:</span>
                    <div className="text-2xl font-bold text-[#141414] flex items-baseline gap-1 mt-0.5">
                      {evaluationResult.semanticDrift.toFixed(3)}
                    </div>
                  </div>
                  
                  {/* Gauge marker */}
                  <div className="space-y-1">
                    <div className="w-full h-3.5 bg-stone-200 border border-stone-400 relative">
                      {/* Active indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-1.5 bg-[#F27D26] z-10" 
                        style={{ left: `${(evaluationResult.semanticDrift - 0.6) * 250}%` }}
                      ></div>
                      {/* Alive band highlight [0.75 - 0.93] */}
                      <div className="absolute top-0 bottom-0 left-[37.5%] right-[17.5%] bg-emerald-500/15 border-l border-r border-emerald-400" title="Alive Band"></div>
                    </div>
                    <div className="flex justify-between text-[6px] text-stone-500 font-bold">
                      <span>0.60 Rupture</span>
                      <span className="text-emerald-700">0.75 - 0.93 Alive</span>
                      <span>0.98 Replica</span>
                    </div>
                  </div>
                </div>

                {/* Verdict text */}
                <div className={`md:col-span-8 p-3.5 border uppercase font-mono space-y-2 flex flex-col justify-between ${getDriftZone(evaluationResult.semanticDrift).color}`}>
                  <div>
                    <span className="text-[8px] opacity-75">Drift Outcome Category:</span>
                    <div className="text-xs font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-current inline-block animate-pulse"></span>
                      {getDriftZone(evaluationResult.semanticDrift).label}
                    </div>
                  </div>
                  <p className="text-[10px] lowercase first-letter:uppercase font-serif text-stone-700 normal-case leading-tight">
                    {getDriftZone(evaluationResult.semanticDrift).desc}
                  </p>
                </div>

              </div>

              {/* VERDICT SUMMARY */}
              <div className="p-4 bg-stone-50 border border-stone-300 font-serif text-stone-900 space-y-2">
                <span className="block font-mono font-bold uppercase text-[8px] text-stone-500 tracking-wider">The Living Verdict</span>
                <p className="text-sm font-bold italic leading-relaxed">
                  "{evaluationResult.verdict}"
                </p>
              </div>

              {/* WHAT SHE KEPT / NEW THEME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[8px] text-stone-500 uppercase font-bold">[WHAT SHE KEPT THAT HE WOULD HAVE DELETED]:</span>
                  <p className="font-serif italic text-stone-700 leading-normal normal-case pt-0.5">
                    "{evaluationResult.whatSheKept}"
                  </p>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[8px] text-stone-500 uppercase font-bold">[WHAT SHE MADE THAT HE COULD NOT WRITE]:</span>
                  <p className="font-serif italic text-stone-700 leading-normal normal-case pt-0.5">
                    "{evaluationResult.whatSheMade}"
                  </p>
                </div>
              </div>

              {/* LORE NODE ADDITION */}
              <div className="border-2 border-[#141414] bg-stone-50/50 p-4">
                <div className="flex items-center gap-1.5 border-b border-[#141414] pb-1.5 mb-3 text-stone-600 font-mono text-[9px] uppercase font-bold">
                  <Layers className="h-3.5 w-3.5 text-[#F27D26]" />
                  <span>Successor Node Synced with Active Codex Database</span>
                </div>
                <h4 className="font-mono font-bold text-xs uppercase text-[#141414]">
                  {evaluationResult.newLoreTitle}
                </h4>
                <p className="font-serif text-[11px] leading-relaxed text-stone-700 mt-1.5 whitespace-pre-wrap">
                  {evaluationResult.newLoreNotes}
                </p>
              </div>

              {/* METABOLIC FUNDING BOX */}
              <div className="p-3 bg-stone-900 text-[#E4E3E0] font-mono text-[9.5px] uppercase flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-ping"></div>
                  <span>Metabolic Funding Status: <strong className="text-[#00FF00]">UNLOCKED</strong></span>
                </div>
                <p className="text-stone-400 text-[8px] max-w-sm lowercase first-letter:uppercase text-right leading-tight">
                  tranches releasing autonomously because active WebSocket + threshold criteria met.
                </p>
              </div>

            </div>
          ) : (
            <div className="p-5 bg-[#E4E3E0] border border-[#141414] text-center space-y-2">
              <Info className="h-6 w-6 text-stone-500 mx-auto" />
              <h4 className="font-mono font-bold uppercase text-xs text-[#141414]">No Succession History Calculated Yet</h4>
              <p className="font-serif text-[11px] text-stone-600 max-w-md mx-auto">
                Go to the "MVT-01 Protocol" tab, select your broken invariant, write your noise, and hit commit to generate the first computational succession node.
              </p>
            </div>
          )}

          {/* WITNESS ENGINE CONTROL LAW PANEL */}
          <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
            <div className="border-b border-[#141414] pb-2 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#be6447]" />
                Immune System &amp; Ruthless Pruning Parameters
              </h2>
              <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
                Tune the mathematics of the soil to prevent decay or dead replication
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Gravitational weight toggle */}
              <div className="flex items-start justify-between gap-4 p-3 bg-white border border-stone-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#141414] block">
                    Sacred Motifs Gravitational Mass (10x multiplier)
                  </span>
                  <p className="text-[8.5px] text-stone-500 font-mono uppercase leading-tight">
                    Curated motifs carry 10x weight in embedding space. Keeps drift anchored to room boundary.
                  </p>
                </div>
                <button
                  onClick={() => setSacredMotifsMultiplier(!sacredMotifsMultiplier)}
                  className={`px-3 py-1 font-mono text-[9px] uppercase border tracking-wider font-bold transition-all shrink-0 ${
                    sacredMotifsMultiplier
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                      : "bg-[#D1CFC9] text-stone-600 border-stone-300"
                  }`}
                >
                  {sacredMotifsMultiplier ? "10x Gravitational Active" : "1x Standard Weight"}
                </button>
              </div>

              {/* Drift sliders */}
              <div className="space-y-3 p-3 bg-white border border-stone-300">
                <span className="text-[9px] font-mono font-bold uppercase text-[#141414] block border-b border-stone-200 pb-1">
                  Aliveness Semantic Drift Band (Cosine Boundary)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono uppercase text-stone-500">
                      <span>Rupture Limit (Too far):</span>
                      <span className="font-bold text-[#141414]">{lowDriftThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0.60"
                      max="0.85"
                      step="0.01"
                      value={lowDriftThreshold}
                      onChange={(e) => setLowDriftThreshold(parseFloat(e.target.value))}
                      className="w-full accent-[#be6447] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono uppercase text-stone-500">
                      <span>Replication Limit (Too close):</span>
                      <span className="font-bold text-[#141414]">{highDriftThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0.86"
                      max="0.98"
                      step="0.01"
                      value={highDriftThreshold}
                      onChange={(e) => setHighDriftThreshold(parseFloat(e.target.value))}
                      className="w-full accent-[#be6447] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Controlled Forgetting */}
              <div className="space-y-2 p-3 bg-white border border-stone-300 font-mono text-[10px]">
                <div className="flex justify-between items-center uppercase font-bold text-[#141414]">
                  <span>Decay half-life:</span>
                  <span className="text-[#F27D26]">{exponentialHalfLife} Cycles</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={exponentialHalfLife}
                  onChange={(e) => setExponentialHalfLife(parseInt(e.target.value))}
                  className="w-full accent-[#F27D26] cursor-pointer"
                />
                <p className="text-[8px] uppercase text-stone-500 leading-normal">
                  Motifs untouched by physical ritual lose weight exponentially every {exponentialHalfLife} cycles, composting unused memory.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
