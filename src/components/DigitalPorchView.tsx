import React, { useState } from "react";
import { ownerFetch } from "../lib/supabaseClient";
import { PorchWeather, SoilAxiom, PorchNode, Album, BranchingIdea } from "../types";
import VascularHearth from "./VascularHearth";
import { 
  CloudSun, 
  Sprout, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Plus, 
  Trash2, 
  Clipboard, 
  Download, 
  Upload, 
  Clock, 
  ArrowRight, 
  Shuffle,
  GitFork,
  MessageSquare,
  Check,
  Flame,
  Info,
  Layers
} from "lucide-react";
import { LineageBraid } from "./LineageBraid";

interface DigitalPorchViewProps {
  weather: PorchWeather;
  onWeatherChange: (weather: PorchWeather) => void;
  axioms: SoilAxiom[];
  onAddAxiom: (text: string) => void;
  onDeleteAxiom: (id: string) => void;
  nodes: PorchNode[];
  onAddNode: (node: PorchNode) => void;
  onDeleteNode: (id: string) => void;
  onUpdateNode: (node: PorchNode) => void;
  onCompost: () => void;
  onSelectPrompt: (prompt: string) => void;
  albums: Album[];
  branches: BranchingIdea[];
}

export default function DigitalPorchView({
  weather,
  onWeatherChange,
  axioms,
  onAddAxiom,
  onDeleteAxiom,
  nodes,
  onAddNode,
  onDeleteNode,
  onUpdateNode,
  onCompost,
  onSelectPrompt,
  albums,
  branches
}: DigitalPorchViewProps) {
  const [newNoticing, setNewNoticing] = useState("");
  const [newAxiomText, setNewAxiomText] = useState("");
  const [isCremating, setIsCremating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Resonance packet import
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // For copy-to-clipboard feedback
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  const [selectedLineageEventId, setSelectedLineageEventId] = useState<string | null>(null);

  // Generate gentle weather mutation descriptions
  const weatherDescriptions = [
    "High kettle resonance, quiet wonder rising, rosemary activity settling, porch light burning warm.",
    "A cold mist settles on the threshold. The kettle hums softly. Porch light dim.",
    "Sunlit deck boards expand. Rosemary activity high. Kettle resonance dry and clicky.",
    "Rain on the tin roof, kettle resonance rising, quiet wonder high, porch light on.",
    "Quiet evening twilight. Porch light casting long shadows, rosemary scent strong."
  ];

  const handleMutateWeatherGently = () => {
    const randomShift = () => Math.max(0, Math.min(1, Math.round((Math.random() * 0.3 - 0.15) * 100) / 100));
    const newKettle = Math.round((weather.kettleResonance + (Math.random() * 0.2 - 0.1)) * 100) / 100;
    const newWonder = Math.round((weather.quietWonder + (Math.random() * 0.2 - 0.1)) * 100) / 100;
    const newRosemary = Math.round((weather.rosemaryActivity + (Math.random() * 0.2 - 0.1)) * 100) / 100;
    const newLight = Math.round((weather.porchLight + (Math.random() * 0.2 - 0.1)) * 100) / 100;

    const randomDesc = weatherDescriptions[Math.floor(Math.random() * weatherDescriptions.length)];

    onWeatherChange({
      kettleResonance: Math.max(0, Math.min(1, newKettle)),
      quietWonder: Math.max(0, Math.min(1, newWonder)),
      rosemaryActivity: Math.max(0, Math.min(1, newRosemary)),
      porchLight: Math.max(0, Math.min(1, newLight)),
      description: randomDesc
    });
  };

  const handleAddAxiomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAxiomText.trim()) return;
    onAddAxiom(newAxiomText.trim());
    setNewAxiomText("");
  };

  const handleBirthCeremonySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticing.trim() || isCremating) return;
    setIsCremating(true);
    setError(null);

    try {
      const response = await ownerFetch("/api/birth-ceremony", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noticing: newNoticing.trim(),
          weather,
          axioms,
          albums,
          branches
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      const freshNode: PorchNode = {
        id: "node_" + Date.now(),
        noticing: newNoticing.trim(),
        timestamp: new Date().toISOString(),
        ancestor: data.ancestor || "Unknown Threshold",
        resonatesWith: data.resonatesWith || ["ordinary miracle"],
        weatherImprint: { ...weather },
        questionGrown: data.questionGrown || "What lies wait in this ordinary moment?",
        mutation: data.mutation || "Acoustic drift in the soil",
        stage: "sprout",
        resonanceWeight: 1.0
      };

      onAddNode(freshNode);
      setNewNoticing("");

      // Update weather description gently based on the AI ceremony outcome
      if (data.weatherDescription) {
        onWeatherChange({
          ...weather,
          description: data.weatherDescription
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The birth ceremony encountered harsh weather. Try again.");
    } finally {
      setIsCremating(false);
    }
  };

  const handleImportSeedPacket = () => {
    setImportStatus(null);
    try {
      if (!importJson.trim()) return;
      const parsed = JSON.parse(importJson.trim());
      
      if (!parsed.noticing) {
        setImportStatus({ type: "error", message: "Invalid seed packet structure. A 'noticing' text is required." });
        return;
      }

      // Perform mutation on import
      const importedNode: PorchNode = {
        id: "node_imported_" + Date.now(),
        noticing: parsed.noticing + " (received from foreign porch)",
        timestamp: new Date().toISOString(),
        ancestor: parsed.ancestor || "A distant porch",
        resonatesWith: parsed.resonatesWith || ["foreign dust"],
        weatherImprint: {
          kettleResonance: parsed.weatherImprint?.kettleResonance || weather.kettleResonance,
          quietWonder: parsed.weatherImprint?.quietWonder || weather.quietWonder,
          rosemaryActivity: parsed.weatherImprint?.rosemaryActivity || weather.rosemaryActivity,
          porchLight: parsed.weatherImprint?.porchLight || weather.porchLight
        },
        questionGrown: parsed.questionGrown || "What has been waiting for your attention?",
        mutation: `Import mutated: ${parsed.mutation || "gently drifted"} in our local soil weather`,
        stage: "seed",
        resonanceWeight: 0.9
      };

      onAddNode(importedNode);
      setImportJson("");
      setImportStatus({ type: "success", message: "Liturgical import ceremony complete! Seed has sprouted." });
    } catch (err) {
      setImportStatus({ type: "error", message: "Failed to parse JSON. Please check formatting." });
    }
  };

  const handleCopyPacket = (node: PorchNode) => {
    const packet = {
      noticing: node.noticing,
      ancestor: node.ancestor,
      resonatesWith: node.resonatesWith,
      weatherImprint: node.weatherImprint,
      questionGrown: node.questionGrown,
      mutation: node.mutation
    };

    navigator.clipboard.writeText(JSON.stringify(packet, null, 2))
      .then(() => {
        setCopiedNodeId(node.id);
        setTimeout(() => setCopiedNodeId(null), 2000);
      })
      .catch(err => console.error("Could not copy seed packet:", err));
  };

  const getStageColor = (stage: PorchNode["stage"]) => {
    switch (stage) {
      case "seed": return "bg-amber-100 text-amber-800 border-amber-300";
      case "sprout": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "rooted": return "bg-teal-100 text-teal-800 border-teal-300";
      case "flowering": return "bg-pink-100 text-pink-800 border-pink-300";
      case "fruit": return "bg-orange-100 text-orange-800 border-orange-300";
      case "compost": return "bg-amber-900/10 text-amber-950 border-amber-900/30";
      case "soil": return "bg-stone-200 text-stone-700 border-stone-400";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: PORCH WEATHER */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-2 mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-[#F27D26]" />
              Current Porch Weather State
            </h2>
            <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
              The environmental parameters that gently mutate your newly birthed tranches
            </p>
          </div>
          <button
            onClick={handleMutateWeatherGently}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono border border-[#141414] uppercase bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all cursor-pointer rounded-none"
            title="Slightly shift parameters in our micro-climate"
          >
            <Shuffle className="h-3 w-3" />
            Mutate Gently
          </button>
        </div>

        <div className="bg-white border border-[#141414] p-3 mb-4 text-[11px] font-mono uppercase text-[#141414]">
          <span className="font-bold text-[#F27D26]">Porch Weather description:</span> {weather.description}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span>Kettle Resonance</span>
              <span className="font-bold">{Math.round(weather.kettleResonance * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={weather.kettleResonance}
              onChange={(e) => onWeatherChange({ ...weather, kettleResonance: parseFloat(e.target.value) })}
              className="w-full accent-[#F27D26]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span>Quiet Wonder</span>
              <span className="font-bold">{Math.round(weather.quietWonder * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={weather.quietWonder}
              onChange={(e) => onWeatherChange({ ...weather, quietWonder: parseFloat(e.target.value) })}
              className="w-full accent-[#F27D26]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span>Rosemary Activity</span>
              <span className="font-bold">{Math.round(weather.rosemaryActivity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={weather.rosemaryActivity}
              onChange={(e) => onWeatherChange({ ...weather, rosemaryActivity: parseFloat(e.target.value) })}
              className="w-full accent-[#F27D26]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span>Porch Light Intensity</span>
              <span className="font-bold">{Math.round(weather.porchLight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={weather.porchLight}
              onChange={(e) => onWeatherChange({ ...weather, porchLight: parseFloat(e.target.value) })}
              className="w-full accent-[#F27D26]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 1.5: VASCULAR HEARTH & RESILIENT TOPOLOGY */}
      <VascularHearth onSelectPrompt={onSelectPrompt} />

      {/* SECTION 2: LITURGICAL BIRTH CEREMONY FORM */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
            <Sprout className="h-4 w-4 text-[#F27D26]" />
            Perform Liturgical Birth Ceremony
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            Pour a fresh ordinary noticing onto the porch. Axiom #2: Nothing is copied. Everything is grown.
          </p>
        </div>

        <form onSubmit={handleBirthCeremonySubmit} className="space-y-3">
          <div>
            <textarea
              value={newNoticing}
              onChange={(e) => setNewNoticing(e.target.value)}
              placeholder="e.g. I noticed the rain on the window today. High kettle resonance, quiet wonder rising."
              rows={3}
              className="w-full text-xs font-serif p-3 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#F27D26] leading-relaxed text-[#141414] rounded-none"
              required
            ></textarea>
          </div>

          {error && (
            <div className="p-2 border border-red-700 bg-red-50 text-red-800 text-[10px] font-mono uppercase">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-[9px] text-stone-500 font-mono uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#F27D26]" />
              Ceremonial code run server-side
            </div>
            <button
              type="submit"
              disabled={isCremating || !newNoticing.trim()}
              className="px-4 py-2 text-[10px] font-mono uppercase border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-black cursor-pointer disabled:opacity-50"
            >
              {isCremating ? "Ceremonizing..." : "Initiate Birth Ceremony 🌱"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: IMPORT CEREMONIAL PACKET */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
            <GitFork className="h-4 w-4 text-[#141414]" />
            Import Resonance Seed Packet
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            "Another porch left a seed here, and my porch grew something different."
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='Paste JSON seed packet here. e.g. {"noticing": "The kettle knows..."}'
              rows={2}
              className="w-full text-xs font-mono p-3 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#F27D26] text-[#141414] rounded-none"
            ></textarea>
          </div>

          {importStatus && (
            <div className={`p-2 border text-[10px] font-mono uppercase ${
              importStatus.type === "success" 
                ? "bg-[#00FF00]/10 border-emerald-500 text-emerald-800" 
                : "bg-red-50 border-red-500 text-red-800"
            }`}>
              {importStatus.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleImportSeedPacket}
              disabled={!importJson.trim()}
              className="px-4 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer disabled:opacity-50"
            >
              Plant Foreign Seed
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: SOIL AXIOMS */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#141414]" />
            Foundational Soil Axioms
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            The laws that keep our garden living instead of behaving like a sterile museum
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {axioms.map((ax) => (
            <div key={ax.id} className="bg-white border border-[#141414] p-3 flex justify-between items-center rounded-none shadow-[1px_1px_0px_0px_#141414]">
              <span className="text-xs font-mono uppercase tracking-wide text-[#141414]">{ax.text}</span>
              <button
                onClick={() => onDeleteAxiom(ax.id)}
                className="text-stone-500 hover:text-red-600 p-0.5 cursor-pointer"
                title="Remove soil axiom"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddAxiomSubmit} className="flex gap-2">
          <input
            type="text"
            value={newAxiomText}
            onChange={(e) => setNewAxiomText(e.target.value)}
            placeholder="Add new foundational soil axiom..."
            className="flex-1 text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-3 py-1 text-[10px] font-mono uppercase border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-black cursor-pointer"
          >
            Axiomate
          </button>
        </form>
      </div>

      {/* SECTION 5: THE PORCH GRAPH LIST (SPROUTED TRANCHES) */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-2 mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
              <Sprout className="h-4 w-4 text-[#F27D26]" />
              The Grown Tranches &amp; Lineages
            </h2>
            <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
              Liturgical nodes currently rooted on the porch threshold
            </p>
          </div>
          
          <button
            onClick={onCompost}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border border-amber-900 bg-[#D1CFC9] hover:bg-[#141414] hover:text-[#E4E3E0] text-amber-950 transition-all cursor-pointer"
            title="Scan graph, lower weight on inactive tranches, decay sprouts"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tend Compost Pile
          </button>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center py-8 bg-[#D1CFC9] border border-[#141414]">
            <Sprout className="h-6 w-6 text-[#141414] mx-auto mb-2" />
            <p className="text-[#141414] text-xs font-mono uppercase tracking-wider">No living tranches detected on the porch.</p>
            <p className="text-stone-600 text-[10px] font-mono mt-1 uppercase">Perform a birth ceremony or import a seed above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.map((node) => (
              <div 
                key={node.id} 
                className="bg-white border-2 border-[#141414] p-4 shadow-[3px_3px_0px_0px_#141414] hover:shadow-[4px_4px_0px_0px_#141414] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#141414]/10 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] uppercase px-1.5 py-0.5 border font-mono ${getStageColor(node.stage)}`}>
                        {node.stage}
                      </span>
                      <span className="text-[9px] text-stone-500 font-mono uppercase">
                        Resonance: {Math.round(node.resonanceWeight * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteNode(node.id)}
                      className="text-[#141414]/60 hover:text-red-600 p-0.5 cursor-pointer"
                      title="Prune branch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-serif italic text-stone-800 bg-[#E4E3E0]/30 p-2 border-l-2 border-[#F27D26] mb-3">
                    "{node.noticing}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-wide text-stone-600 mb-3">
                    <div>
                      <span className="font-bold text-[#141414]">Lineage / Ancestor:</span>
                      <div className="text-stone-500 mt-0.5">{node.ancestor || "None"}</div>
                    </div>
                    <div>
                      <span className="font-bold text-[#141414]">Grown Question:</span>
                      <div className="text-stone-500 mt-0.5 font-serif italic lowercase">{node.questionGrown}</div>
                    </div>
                    <div>
                      <span className="font-bold text-[#141414]">Active Mutation:</span>
                      <div className="text-[#F27D26] mt-0.5 font-semibold">{node.mutation}</div>
                    </div>
                    <div>
                      <span className="font-bold text-[#141414]">Weather Imprint:</span>
                      <div className="text-stone-500 mt-0.5 flex flex-wrap gap-1">
                        <span>K:{Math.round(node.weatherImprint.kettleResonance * 100)}%</span>
                        <span>W:{Math.round(node.weatherImprint.quietWonder * 100)}%</span>
                        <span>R:{Math.round(node.weatherImprint.rosemaryActivity * 100)}%</span>
                        <span>L:{Math.round(node.weatherImprint.porchLight * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {node.resonatesWith.map((tag, i) => (
                      <span key={i} className="bg-white border border-[#141414] text-[#141414] text-[8px] uppercase px-1.5 py-0.5 font-mono">
                        ~ {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#141414]/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[8px] text-stone-500 font-mono uppercase">
                    <Clock className="h-3 w-3 text-stone-500" />
                    {new Date(node.timestamp).toLocaleString()}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {node.ledgerEventId && (
                      <button
                        onClick={() => setSelectedLineageEventId(node.ledgerEventId || null)}
                        className="text-[9px] font-mono uppercase border border-[#64abbe] bg-[#64abbe]/10 hover:bg-[#64abbe] hover:text-stone-900 text-[#64abbe] px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-all"
                        title="View the genetic lineage lineage backwards in the shared ledger"
                      >
                        <Layers className="h-3 w-3" />
                        View Lineage
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyPacket(node)}
                      className="text-[9px] font-mono uppercase border border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] px-2 py-1 flex items-center gap-1 cursor-pointer"
                      title="Copy lightweight JSON representation of this seed"
                    >
                      {copiedNodeId === node.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Packet Copied
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-3 w-3" />
                          Export Seed
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => onSelectPrompt(`Discuss the grown tranch seed "${node.noticing}" (derived from ancestor "${node.ancestor}" under the weather "${node.mutation}"). What speculative dialogue emerges here?`)}
                      className="text-[9px] font-mono uppercase tracking-wider font-bold hover:underline flex items-center gap-1 cursor-pointer text-[#141414]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Weave discussion
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPOSITING EXPLANATORY LEGEND */}
      <div className="bg-[#D1CFC9] border border-[#141414] p-4 text-[10px] font-mono uppercase tracking-wider text-stone-700">
        <h3 className="font-bold text-[#141414] mb-1 flex items-center gap-1">
          <Info className="h-4 w-4" />
          The Compost Soil Lifecycle
        </h3>
        <p className="leading-relaxed">
          Tending the Compost heap triggers the <code className="font-bold text-[#141414]">compost()</code> sequence. 
          Older or ignored tranches lose resonance weight over time. 
          As they decay, they cycle through states:
          <br/>
          <span className="font-bold text-[#141414]">Sprout</span> (100% - 80%) &rarr; 
          <span className="font-bold text-[#141414]">Rooted</span> (80% - 60%) &rarr; 
          <span className="font-bold text-[#141414]">Flowering</span> (60% - 40%) &rarr; 
          <span className="font-bold text-[#141414]">Fruit</span> (40% - 20%) &rarr; 
          <span className="font-bold text-[#141414]">Compost</span> (20% - 0%) &rarr; 
          <span className="font-bold text-[#141414]">Soil</span> (0%).
          <br/>
          Once a tranch fully merges into the Soil, its structural remnants become the nourishing layer of active memories!
        </p>
      </div>

      {selectedLineageEventId && (
        <div className="fixed inset-0 bg-[#141414]/90 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" id="lineage-braid-modal">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <LineageBraid 
              eventId={selectedLineageEventId} 
              onClose={() => setSelectedLineageEventId(null)} 
            />
          </div>
        </div>
      )}

    </div>
  );
}
