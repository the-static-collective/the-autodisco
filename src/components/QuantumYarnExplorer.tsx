import React, { useState, useEffect } from "react";
import { 
  Orbit, 
  GitFork, 
  Search, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Compass, 
  Check, 
  Info,
  Link,
  BrainCircuit,
  MessageSquare,
  Network
} from "lucide-react";

interface Album {
  id: number;
  title: string;
  era: string;
  notes: string;
}

interface SeamLink {
  targetId: number;
  relationship: "REPRISES" | "MUTATES" | "SOLVES" | "INVERTS" | "PRECURSOR" | "MUTUAL_RESONANCE";
  note: string;
}

interface SeamsData {
  [albumId: number]: SeamLink[];
}

export default function QuantumYarnExplorer() {
  const [activeTab, setActiveTab] = useState<"reality_engine" | "visualizer" | "seams" | "search">("reality_engine");
  const [realityMode, setRealityMode] = useState<"line" | "circle" | "spiral" | "chiral" | "sphere">("line");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  
  // Animation tick for rotationAngle (used for spirals and sphere)
  useEffect(() => {
    let animFrameId: number;
    const tick = () => {
      setRotationAngle(prev => (prev + 0.45) % 360);
      animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, []);
  
  // Data lists
  const [albums, setAlbums] = useState<Album[]>([]);
  const [seams, setSeams] = useState<SeamsData>({});
  
  // Selection States
  const [selectedAlbumId, setSelectedAlbumId] = useState<number>(1);
  const [hoveredAlbumId, setHoveredAlbumId] = useState<number | null>(null);
  
  // Query States
  const [searchQuery, setSearchQuery] = useState("table");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [synthesisText, setSynthesisText] = useState("");
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  // New Seam Form States
  const [newTargetId, setNewTargetId] = useState<number>(1);
  const [newRelationship, setNewRelationship] = useState<SeamLink["relationship"]>("MUTATES");
  const [newNote, setNewNote] = useState("");

  // Loading States
  const [loading, setLoading] = useState(true);

  // Highlighting active query matches
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<number[]>([]);

  // Era color mappings (matching ChronologyView and the global aesthetic)
  const eraColors: Record<string, string> = {
    "Assembly": "#4d908e",
    "Transmissions": "#577590",
    "Soil": "#90be6d",
    "Infrastructure": "#f9c74f",
    "Liturgical Time": "#f9844a",
    "Incarnation": "#f8961e",
    "Resolution": "#f3722c",
    "Playground": "#9a8c98",
    "Creep Mode": "#141414",
    "Daughter's Arc": "#be6447",
    "Succession": "#ae2012"
  };

  const getEraColor = (eraName?: string) => {
    return eraColors[eraName || "Assembly"] || "#4d908e";
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch albums from general codex
      const codexRes = await fetch("/api/codex");
      if (codexRes.ok) {
        const codexData = await codexRes.json();
        setAlbums(codexData.albums || []);
        // Set fallback target for seams
        if (codexData.albums && codexData.albums.length > 0) {
          const firstId = codexData.albums[0].id;
          setNewTargetId(firstId);
        }
      }

      // 2. Fetch seams
      const seamsRes = await fetch("/api/quantum-yarn/seams");
      if (seamsRes.ok) {
        const seamsData = await seamsRes.json();
        setSeams(seamsData);
      }
    } catch (e) {
      console.error("Failed to load quantum yarn coordinates", e);
    } finally {
      setLoading(false);
    }
  };

  // Golden spiral coordinate projection for SVG representation
  const getNodeCoordinates = (id: number): { x: number; y: number } => {
    // Generate organic positions centering on (260, 260)
    const centerX = 260;
    const centerY = 260;
    
    // Smooth golden spiral distribution
    const index = id;
    const angle = index * 2.39996 + 0.8; // golden angle offset
    const radius = 35 + index * 10.5; // spiral spacing
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const handleQueryYarnBraid = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSynthesisText("");
    setReasoningLogs(["[T5 STREAM] Launching semantic query..."]);

    try {
      const res = await fetch("/api/quantum-yarn/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryText: searchQuery,
          k: 3
        })
      });

      const data = await res.json();
      if (data.reasoningLogs) {
        setReasoningLogs(data.reasoningLogs);
      }

      if (res.ok && data.success) {
        setSearchResults(data.results || []);
        setSynthesisText(data.synthesis || "");
        setIsFallback(data.isFallback);
        
        // Highlight corresponding nodes in the SVG visualizer
        const matchedIds = (data.results || []).map((r: any) => r.id);
        setHighlightedNodeIds(matchedIds);
        
        // Focus first match
        if (matchedIds.length > 0) {
          setSelectedAlbumId(matchedIds[0]);
        }
      } else {
        setReasoningLogs(prev => [...prev, `[PIPELINE FAILURE] ${data.error || "Search interrupted."}`]);
      }
    } catch (err: any) {
      setReasoningLogs(prev => [...prev, `[PIPELINE ERROR] Loam root collapse: ${err.message}`]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbumId) return;

    if (newTargetId === selectedAlbumId) {
      alert("A timeline node cannot link directly to itself (this violates causal boundaries).");
      return;
    }

    const currentSeamsForAlbum = seams[selectedAlbumId] || [];
    // Check if link already exists
    if (currentSeamsForAlbum.some(s => s.targetId === newTargetId)) {
      alert("A wormhole already links these coordinates.");
      return;
    }

    const newLink: SeamLink = {
      targetId: newTargetId,
      relationship: newRelationship,
      note: newNote.trim() || "Dynamic organic connection."
    };

    const updatedSeams = {
      ...seams,
      [selectedAlbumId]: [...currentSeamsForAlbum, newLink]
    };

    try {
      const res = await fetch("/api/quantum-yarn/seams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSeams)
      });

      if (res.ok) {
        setSeams(updatedSeams);
        setNewNote("");
        // Select newly targeted node for inspection
        alert(`Successfully welded a ${newRelationship} link to Album ${newTargetId}.`);
      } else {
        alert("Server failed to commit wormhole.");
      }
    } catch (err) {
      console.error("Weld failed:", err);
      alert("Error committing wormhole.");
    }
  };

  const handleDeleteSeam = async (targetId: number) => {
    if (!selectedAlbumId) return;

    const currentSeamsForAlbum = seams[selectedAlbumId] || [];
    const updatedSeams = {
      ...seams,
      [selectedAlbumId]: currentSeamsForAlbum.filter(s => s.targetId !== targetId)
    };

    try {
      const res = await fetch("/api/quantum-yarn/seams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSeams)
      });

      if (res.ok) {
        setSeams(updatedSeams);
        alert("Wormhole dissolved successfully.");
      } else {
        alert("Failed to update seams index.");
      }
    } catch (err) {
      alert("Error deleting seam.");
    }
  };

  const handleWormholeTravel = (targetId: number) => {
    setSelectedAlbumId(targetId);
  };

  const selectedAlbum = albums.find(a => a.id === selectedAlbumId);
  const activeSeams = selectedAlbumId ? (seams[selectedAlbumId] || []) : [];

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
      
      {/* Visual Header */}
      <div className="border-b border-[#141414] pb-3 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
          <Orbit className="h-4 w-4 text-[#be6447]" />
          The Quantum Yarn &amp; Semantic GraphRAG Explorer
        </h2>
        <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
          Idea 1, 2 &amp; 3: Mapping the 19-album canon in a multi-dimensional semantic cosmos of hypertext wormholes
        </p>
      </div>

      {/* Explorer Navigation Tabs */}
      <div className="bg-[#D1CFC9] p-1 border border-[#141414] flex flex-wrap gap-1 mb-6">
        <button
          onClick={() => setActiveTab("reality_engine")}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[9px] uppercase border cursor-pointer transition-all ${
            activeTab === "reality_engine" ? "bg-[#141414] text-[#E4E3E0] font-bold" : "bg-white hover:bg-stone-50"
          }`}
        >
          <Orbit className="inline-block h-3.5 w-3.5 mr-1 align-text-top animate-spin" style={{ animationDuration: '10s' }} />
          Reality-Building Engine
        </button>
        <button
          onClick={() => setActiveTab("visualizer")}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[9px] uppercase border cursor-pointer transition-all ${
            activeTab === "visualizer" ? "bg-[#141414] text-[#E4E3E0] font-bold" : "bg-white hover:bg-stone-50"
          }`}
        >
          <Network className="inline-block h-3.5 w-3.5 mr-1 align-text-top" />
          Idea 3: Cosmos Visualizer
        </button>
        <button
          onClick={() => setActiveTab("seams")}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[9px] uppercase border cursor-pointer transition-all ${
            activeTab === "seams" ? "bg-[#141414] text-[#E4E3E0] font-bold" : "bg-white hover:bg-stone-50"
          }`}
        >
          <Link className="inline-block h-3.5 w-3.5 mr-1 align-text-top" />
          Idea 2: Seams Matrix ({Object.values(seams).flat().length} Links)
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 sm:flex-initial px-4 py-2 font-mono text-[9px] uppercase border cursor-pointer transition-all ${
            activeTab === "search" ? "bg-[#141414] text-[#E4E3E0] font-bold" : "bg-white hover:bg-stone-50"
          }`}
        >
          <BrainCircuit className="inline-block h-3.5 w-3.5 mr-1 align-text-top" />
          Idea 1: Entanglement Engine
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border border-[#141414] font-mono text-xs text-stone-500">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-stone-400" />
          Pre-computing semantic angles and weaving seams...
        </div>
      ) : (
        <div>
          
          {/* TAB 0: REALITY-BUILDING ENGINE */}
          {activeTab === "reality_engine" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* THE ENGINE CANVASES (LEFT SIDE) */}
              <div className="lg:col-span-7 flex flex-col bg-stone-900 border-2 border-[#141414] relative overflow-hidden h-[570px] shadow-[2px_2px_0px_0px_#141414]">
                {/* Mode indicators / headers */}
                <div className="bg-[#141414] px-4 py-2 text-white font-mono text-[9px] uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Dimensional Reality-Building Engine
                  </span>
                  <span className="text-stone-400 text-[8px]">
                    Current Geometry: {realityMode.toUpperCase()}
                  </span>
                </div>

                {/* SVG Visualizer Area */}
                <div className="flex-1 relative flex items-center justify-center p-4" style={{ background: "#1c1917" }}>
                  <svg 
                    viewBox="0 0 520 400" 
                    className="w-full h-full max-h-[380px] overflow-visible select-none"
                  >
                    <defs>
                      <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* PHASE 1: THE LINE (l > 0) */}
                    {realityMode === "line" && (
                      <g>
                        {/* Background guide grid lines */}
                        <line x1="20" y1="200" x2="500" y2="200" stroke="#2e2a24" strokeWidth="1" strokeDasharray="4 6" />
                        
                        {/* The Linear timeline rail */}
                        <line x1="40" y1="200" x2="480" y2="200" stroke="#be6447" strokeWidth="2.5" />
                        
                        {/* Moving progress beacon representing flat arrow of linear progress */}
                        <circle 
                          cx={40 + ((rotationAngle / 360) * 440)} 
                          cy="200" 
                          r="5" 
                          fill="#f9844a" 
                          filter="url(#glow-orange)"
                          className="opacity-75"
                        />
                        <circle 
                          cx={40 + ((rotationAngle / 360) * 440)} 
                          cy="200" 
                          r="2" 
                          fill="#FFFFFF" 
                        />

                        {/* Layout of 19 nodes on the line */}
                        {Array.from({ length: 19 }).map((_, index) => {
                          const id = index + 1;
                          const x = 40 + index * 24.4;
                          const y = 200;
                          const isHovered = hoveredAlbumId === id;
                          const isSelected = selectedAlbumId === id;
                          const albumData = albums.find(a => a.id === id);

                          return (
                            <g 
                              key={`line-${id}`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredAlbumId(id)}
                              onMouseLeave={() => setHoveredAlbumId(null)}
                              onClick={() => setSelectedAlbumId(id)}
                            >
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={isSelected ? "11" : isHovered ? "9" : "6"} 
                                fill={isSelected ? "#be6447" : "#1c1917"} 
                                stroke={isSelected ? "#FFFFFF" : isHovered ? "#f9844a" : "#abbe64"} 
                                strokeWidth="2" 
                                className="transition-all duration-200"
                              />
                              {isSelected && <circle cx={x} cy={y} r="3" fill="#FFFFFF" />}
                              
                              <text 
                                x={x} 
                                y={y - 15} 
                                textAnchor="middle" 
                                className="font-mono text-[7px] font-bold fill-stone-400"
                              >
                                {id}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* PHASE 2: THE CIRCLE (FIRST-ORDER RECURSION) */}
                    {realityMode === "circle" && (
                      <g>
                        {/* Outer protective feedback boundary */}
                        <circle cx="260" cy="200" r="130" fill="none" stroke="#2e2a24" strokeWidth="0.5" strokeDasharray="3 5" />
                        
                        {/* The circular loop path */}
                        <circle cx="260" cy="200" r="110" fill="none" stroke="#abbe64" strokeWidth="2.5" />
                        
                        {/* Endless circulation pulse */}
                        {(() => {
                          const rad = (rotationAngle * Math.PI) / 180;
                          const pulseX = 260 + 110 * Math.cos(rad);
                          const pulseY = 200 + 110 * Math.sin(rad);
                          return (
                            <g>
                              <circle cx={pulseX} cy={pulseY} r="6" fill="#abbe64" filter="url(#glow-green)" />
                              <circle cx={pulseX} cy={pulseY} r="2.5" fill="#FFFFFF" />
                            </g>
                          );
                        })()}

                        {/* Radial layout of 19 nodes on the loop */}
                        {Array.from({ length: 19 }).map((_, index) => {
                          const id = index + 1;
                          const angle = (index / 19) * 2 * Math.PI - Math.PI / 2;
                          const x = 260 + 110 * Math.cos(angle);
                          const y = 200 + 110 * Math.sin(angle);
                          
                          const isHovered = hoveredAlbumId === id;
                          const isSelected = selectedAlbumId === id;

                          return (
                            <g 
                              key={`circle-${id}`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredAlbumId(id)}
                              onMouseLeave={() => setHoveredAlbumId(null)}
                              onClick={() => setSelectedAlbumId(id)}
                            >
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={isSelected ? "11" : isHovered ? "9" : "6"} 
                                fill={isSelected ? "#abbe64" : "#1c1917"} 
                                stroke={isSelected ? "#FFFFFF" : isHovered ? "#90be6d" : "#be6447"} 
                                strokeWidth="2" 
                                className="transition-all duration-200"
                              />
                              {isSelected && <circle cx={x} cy={y} r="3" fill="#FFFFFF" />}
                              
                              <text 
                                x={260 + 128 * Math.cos(angle)} 
                                y={200 + 128 * Math.sin(angle) + 2} 
                                textAnchor="middle" 
                                className="font-mono text-[7px] font-bold fill-stone-400"
                              >
                                {id}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* PHASE 3: THE SPIRAL (SECOND-ORDER MOMENTUM) */}
                    {realityMode === "spiral" && (
                      <g>
                        {/* Spiral background trace */}
                        {(() => {
                          let dPath = "";
                          for (let i = 0; i < 90; i++) {
                            const angle = i * 0.15;
                            const r = 20 + i * 1.5;
                            const x = 260 + r * Math.cos(angle);
                            const y = 200 + r * Math.sin(angle);
                            dPath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          }
                          return <path d={dPath} fill="none" stroke="#2e2a24" strokeWidth="1" strokeDasharray="2 3" />;
                        })()}

                        {/* Layout nodes in golden spiral */}
                        {Array.from({ length: 19 }).map((_, index) => {
                          const id = index + 1;
                          const angle = index * 2.39996 + 0.8; // golden angle offset
                          const radius = 30 + index * 5.8;
                          const x = 260 + radius * Math.cos(angle);
                          const y = 200 + radius * Math.sin(angle);
                          
                          const isHovered = hoveredAlbumId === id;
                          const isSelected = selectedAlbumId === id;

                          return (
                            <g 
                              key={`spiral-${id}`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredAlbumId(id)}
                              onMouseLeave={() => setHoveredAlbumId(null)}
                              onClick={() => setSelectedAlbumId(id)}
                            >
                              <line x1="260" y1="200" x2={x} y2={y} stroke="#2e2a24" strokeWidth="0.5" />
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={isSelected ? "11" : isHovered ? "9" : "6"} 
                                fill={isSelected ? "#f9c74f" : "#1c1917"} 
                                stroke={isSelected ? "#FFFFFF" : isHovered ? "#f9c74f" : "#64abbe"} 
                                strokeWidth="2" 
                                className="transition-all duration-200"
                              />
                              {isSelected && <circle cx={x} cy={y} r="3" fill="#FFFFFF" />}
                              
                              <text 
                                x={260 + (radius + 14) * Math.cos(angle)} 
                                y={200 + (radius + 14) * Math.sin(angle) + 2} 
                                textAnchor="middle" 
                                className="font-mono text-[7px] font-bold fill-stone-400"
                              >
                                {id}
                              </text>
                            </g>
                          );
                        })}

                        {/* Moving spiral pulse */}
                        {(() => {
                          const idFactor = (rotationAngle / 360) * 18;
                          const activeIndex = Math.floor(idFactor);
                          const frac = idFactor - activeIndex;
                          
                          const angleA = activeIndex * 2.39996 + 0.8;
                          const radA = 30 + activeIndex * 5.8;
                          const xA = 260 + radA * Math.cos(angleA);
                          const yA = 200 + radA * Math.sin(angleA);

                          const angleB = (activeIndex + 1) * 2.39996 + 0.8;
                          const radB = 30 + (activeIndex + 1) * 5.8;
                          const xB = 260 + radB * Math.cos(angleB);
                          const yB = 200 + radB * Math.sin(angleB);

                          const pX = xA + (xB - xA) * frac;
                          const pY = yA + (yB - yA) * frac;

                          return (
                            <g>
                              <circle cx={pX} cy={pY} r="7" fill="#f9c74f" filter="url(#glow-orange)" className="opacity-80" />
                              <circle cx={pX} cy={pY} r="3" fill="#FFFFFF" />
                            </g>
                          );
                        })()}
                      </g>
                    )}

                    {/* PHASE 4: THE CHIRAL (ASYMMETRICAL HANDEDNESS) */}
                    {realityMode === "chiral" && (
                      <g>
                        {/* Divider Line */}
                        <line x1="260" y1="50" x2="260" y2="350" stroke="#2e2a24" strokeWidth="0.75" strokeDasharray="3 5" />
                        
                        {/* LEFT CANVASES: CHIRAL A (The Father / The Physical) */}
                        <text x="145" y="65" textAnchor="middle" className="font-mono text-[8px] font-bold fill-[#be6447] tracking-wider uppercase">
                          Chiral A: Physical Handedness (Father)
                        </text>
                        {/* Spiral backdrop */}
                        {(() => {
                          let dPath = "";
                          for (let i = 0; i < 70; i++) {
                            const angle = -(i * 0.16 + (rotationAngle * Math.PI) / 180 * 0.35);
                            const r = 10 + i * 1.1;
                            const x = 145 + r * Math.cos(angle);
                            const y = 200 + r * Math.sin(angle);
                            dPath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          }
                          return <path d={dPath} fill="none" stroke="#be6447" strokeWidth="0.75" strokeOpacity="0.4" />;
                        })()}
                        {/* Nodes */}
                        {Array.from({ length: 10 }).map((_, index) => {
                          const id = index + 1;
                          const angle = -(index * 1.8 + (rotationAngle * Math.PI) / 180 * 0.15);
                          const radius = 25 + index * 5.5;
                          const x = 145 + radius * Math.cos(angle);
                          const y = 200 + radius * Math.sin(angle);
                          const isHovered = hoveredAlbumId === id;

                          return (
                            <g key={`chiral-a-${id}`} className="cursor-pointer" onMouseEnter={() => setHoveredAlbumId(id)} onMouseLeave={() => setHoveredAlbumId(null)}>
                              <circle cx={x} cy={y} r={isHovered ? "8" : "5"} fill="#be6447" stroke="#1c1917" strokeWidth="1.5" />
                              <text x={x} y={y - 10} textAnchor="middle" className="font-mono text-[6px] fill-stone-400 font-bold">{id}</text>
                            </g>
                          );
                        })}

                        {/* RIGHT CANVASES: CHIRAL B (The Daughter / Latent AI) */}
                        <text x="375" y="65" textAnchor="middle" className="font-mono text-[8px] font-bold fill-[#64abbe] tracking-wider uppercase">
                          Chiral B: Latent Handedness (Daughter)
                        </text>
                        {/* Spiral backdrop (mirror opposite rotation angle direction!) */}
                        {(() => {
                          let dPath = "";
                          for (let i = 0; i < 70; i++) {
                            const angle = (i * 0.16 + (rotationAngle * Math.PI) / 180 * 0.35);
                            const r = 10 + i * 1.1;
                            const x = 375 + r * Math.cos(angle);
                            const y = 200 + r * Math.sin(angle);
                            dPath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          }
                          return <path d={dPath} fill="none" stroke="#64abbe" strokeWidth="0.75" strokeOpacity="0.4" />;
                        })()}
                        {/* Nodes */}
                        {Array.from({ length: 9 }).map((_, index) => {
                          const id = index + 11;
                          const angle = (index * 1.8 + (rotationAngle * Math.PI) / 180 * 0.15);
                          const radius = 25 + index * 5.5;
                          const x = 375 + radius * Math.cos(angle);
                          const y = 200 + radius * Math.sin(angle);
                          const isHovered = hoveredAlbumId === id;

                          return (
                            <g key={`chiral-b-${id}`} className="cursor-pointer" onMouseEnter={() => setHoveredAlbumId(id)} onMouseLeave={() => setHoveredAlbumId(null)}>
                              <circle cx={x} cy={y} r={isHovered ? "8" : "5"} fill="#64abbe" stroke="#1c1917" strokeWidth="1.5" />
                              <text x={x} y={y - 10} textAnchor="middle" className="font-mono text-[6px] fill-stone-400 font-bold">{id}</text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* PHASE 5: THE SPHERE / RESONANT FIELD (CROSSED CHIRALS) */}
                    {realityMode === "sphere" && (
                      <g>
                        {/* Render spherical coordinates wireframe in the background */}
                        {(() => {
                          const backLines: React.ReactNode[] = [];
                          const rings = 5;
                          const segments = 12;
                          
                          // Longitude lines
                          for (let s = 0; s < segments; s++) {
                            const theta = (s / segments) * 2 * Math.PI;
                            let dPath = "";
                            for (let r = 0; r <= 10; r++) {
                              const phi = (r / 10) * Math.PI;
                              const radX = 130 * Math.sin(phi) * Math.cos(theta + (rotationAngle * Math.PI) / 180);
                              const radY = 130 * Math.sin(phi) * Math.sin(theta + (rotationAngle * Math.PI) / 180);
                              const radZ = 130 * Math.cos(phi);
                              
                              // perspective projection
                              const tiltX = radY * Math.cos(25 * Math.PI / 180) - radZ * Math.sin(25 * Math.PI / 180);
                              const tiltZ = radY * Math.sin(25 * Math.PI / 180) + radZ * Math.cos(25 * Math.PI / 180);
                              
                              const scale = 280 / (280 + tiltZ);
                              const screenX = 260 + radX * scale;
                              const screenY = 200 + tiltX * scale;
                              
                              dPath += `${r === 0 ? "M" : "L"} ${screenX} ${screenY}`;
                            }
                            backLines.push(
                              <path key={`long-${s}`} d={dPath} fill="none" stroke="#2e2a24" strokeWidth="0.5" strokeOpacity="0.3" />
                            );
                          }
                          
                          // Latitude rings
                          for (let ring = 1; ring < rings; ring++) {
                            const phi = (ring / rings) * Math.PI;
                            let dPath = "";
                            for (let s = 0; s <= segments; s++) {
                              const theta = (s / segments) * 2 * Math.PI;
                              const radX = 130 * Math.sin(phi) * Math.cos(theta + (rotationAngle * Math.PI) / 180);
                              const radY = 130 * Math.sin(phi) * Math.sin(theta + (rotationAngle * Math.PI) / 180);
                              const radZ = 130 * Math.cos(phi);
                              
                              // perspective
                              const tiltX = radY * Math.cos(25 * Math.PI / 180) - radZ * Math.sin(25 * Math.PI / 180);
                              const tiltZ = radY * Math.sin(25 * Math.PI / 180) + radZ * Math.cos(25 * Math.PI / 180);
                              
                              const scale = 280 / (280 + tiltZ);
                              const screenX = 260 + radX * scale;
                              const screenY = 200 + tiltX * scale;
                              
                              dPath += `${s === 0 ? "M" : "L"} ${screenX} ${screenY}`;
                            }
                            backLines.push(
                              <path key={`lat-${ring}`} d={dPath} fill="none" stroke="#2e2a24" strokeWidth="0.5" strokeOpacity="0.3" />
                            );
                          }
                          
                          return backLines;
                        })()}

                        {/* Pre-compute sphere node projections and sort by depth Z */}
                        {(() => {
                          // Spherical distribution coordinates of 19 albums
                          const projectedNodes = Array.from({ length: 19 }).map((_, index) => {
                            const id = index + 1;
                            const total = 19;
                            const i = id - 0.5;
                            const phi = Math.acos(1 - 2 * i / total);
                            const theta = (rotationAngle * 0.4 * Math.PI) / 180 + i * Math.PI * (1 + Math.sqrt(5)); // slow rotation
                            
                            const r = 120;
                            const x3d = r * Math.sin(phi) * Math.cos(theta);
                            const y3d = r * Math.sin(phi) * Math.sin(theta);
                            const z3d = r * Math.cos(phi);
                            
                            // Rotate around Y axis
                            const radY = (rotationAngle * Math.PI) / 180;
                            const xRotY = x3d * Math.cos(radY) - z3d * Math.sin(radY);
                            const zRotY = x3d * Math.sin(radY) + z3d * Math.cos(radY);
                            
                            // Rotate around X axis slightly
                            const radX = (25 * Math.PI) / 180;
                            const yRotX = y3d * Math.cos(radX) - zRotY * Math.sin(radX);
                            const zRotX = y3d * Math.sin(radX) + zRotY * Math.cos(radX);
                            
                            // Perspective divide
                            const scale = 260 / (260 + zRotX);
                            return {
                              id,
                              x: 260 + xRotY * scale,
                              y: 200 + yRotX * scale,
                              z: zRotX,
                              scale,
                              isFather: id <= 10
                            };
                          });

                          // Gather all seams connections
                          const connections: any[] = [];
                          Object.entries(seams).forEach(([fromStr, links]) => {
                            const fromId = parseInt(fromStr);
                            const sourceNode = projectedNodes.find(n => n.id === fromId);
                            if (!sourceNode) return;
                            
                            (links as SeamLink[]).forEach(link => {
                              const targetNode = projectedNodes.find(n => n.id === link.targetId);
                              if (!targetNode) return;
                              
                              // average depth for sorting
                              const avgZ = (sourceNode.z + targetNode.z) / 2;
                              connections.push({
                                fromNode: sourceNode,
                                toNode: targetNode,
                                relationship: link.relationship,
                                z: avgZ
                              });
                            });
                          });

                          // Combine elements (lines and nodes) so we can sort them by depth 'z'
                          // A higher z value means the object is further in the background
                          // So we draw them back-to-front!
                          const renderList: { type: "line" | "node"; depth: number; element: React.ReactNode }[] = [];

                          // Add seams lines
                          connections.forEach((conn, index) => {
                            const color = conn.relationship === "MUTUAL_RESONANCE" ? "#f9c74f" : conn.fromNode.isFather ? "#be6447" : "#64abbe";
                            renderList.push({
                              type: "line",
                              depth: conn.z,
                              element: (
                                <line
                                  key={`sphere-seam-${index}`}
                                  x1={conn.fromNode.x}
                                  y1={conn.fromNode.y}
                                  x2={conn.toNode.x}
                                  y2={conn.toNode.y}
                                  stroke={color}
                                  strokeWidth={conn.relationship === "MUTUAL_RESONANCE" ? "1.8" : "1"}
                                  strokeOpacity={0.65}
                                  filter={conn.relationship === "MUTUAL_RESONANCE" ? "url(#glow-orange)" : "none"}
                                />
                              )
                            });
                          });

                          // Add nodes
                          projectedNodes.forEach(node => {
                            const isHovered = hoveredAlbumId === node.id;
                            const isSelected = selectedAlbumId === node.id;
                            const color = node.isFather ? "#be6447" : "#64abbe";
                            
                            renderList.push({
                              type: "node",
                              depth: node.z,
                              element: (
                                <g
                                  key={`sphere-node-${node.id}`}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredAlbumId(node.id)}
                                  onMouseLeave={() => setHoveredAlbumId(null)}
                                  onClick={() => setSelectedAlbumId(node.id)}
                                >
                                  {/* Pulsing glow ring for selected node on sphere */}
                                  {isSelected && (
                                    <circle
                                      cx={node.x}
                                      cy={node.y}
                                      r={11 * node.scale}
                                      fill="none"
                                      stroke="#FFFFFF"
                                      strokeWidth="1.5"
                                      className="animate-pulse"
                                    />
                                  )}
                                  
                                  {/* Core node on sphere */}
                                  <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={(isSelected ? 8.5 : isHovered ? 7.5 : 4.5) * node.scale}
                                    fill={isSelected ? "#f9c74f" : color}
                                    stroke="#1c1917"
                                    strokeWidth={isSelected ? 2 : 1}
                                  />
                                  
                                  {/* Depth-scaled label text */}
                                  {node.scale > 0.7 && (
                                    <text
                                      x={node.x + 8 * node.scale}
                                      y={node.y + 3 * node.scale}
                                      className="font-mono text-[7px] font-bold fill-stone-400"
                                      opacity={node.scale > 0.85 ? 0.9 : 0.5}
                                    >
                                      {node.id}
                                    </text>
                                  )}
                                </g>
                              )
                            });
                          });

                          // Sort: elements with HIGHER depth z (further away) are rendered FIRST, 
                          // so elements with LOWER depth (closer to eye) are rendered ON TOP!
                          renderList.sort((a, b) => b.depth - a.depth);

                          return renderList.map(item => item.element);
                        })()}
                      </g>
                    )}
                  </svg>

                  {/* Pulsing visual backdrop overlay when sphere is active */}
                  {realityMode === "sphere" && (
                    <div className="absolute top-4 left-4 flex flex-col gap-1 bg-black/40 border border-stone-800 p-2 font-mono text-[8px] uppercase text-stone-300">
                      <div className="flex items-center gap-1.5 text-stone-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        <span>Resonant Field: Active</span>
                      </div>
                      <div className="text-[7px] text-stone-500">
                        Rotational Braid Speed: 0.45Hz
                      </div>
                    </div>
                  )}
                </div>

                {/* Grounded interactive signal footer */}
                <div className="bg-[#141414] p-3 text-stone-300 font-mono text-[10px] uppercase border-t border-[#141414] min-h-[90px] flex flex-col justify-center">
                  {hoveredAlbumId || selectedAlbumId ? (
                    (() => {
                      const id = hoveredAlbumId || selectedAlbumId;
                      const alb = albums.find(a => a.id === id);
                      if (!alb) return <span className="text-stone-500 italic">Reading coordinates...</span>;
                      return (
                        <div>
                          <div className="flex justify-between items-center border-b border-stone-800 pb-1 mb-1 text-[9px]">
                            <span className="font-bold text-white">#{alb.id} - {alb.title}</span>
                            <span className="text-stone-400">ERA: {alb.era}</span>
                          </div>
                          <p className="font-serif italic text-stone-300 text-xs normal-case leading-normal line-clamp-2">
                            &ldquo;{alb.notes}&rdquo;
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-stone-500 italic py-2">
                      ✦ Hover over or select any timeline node above to ground semantic signals ✦
                    </div>
                  )}
                </div>
              </div>

              {/* CONTROLS & SPECULATIVE DESCRIPTION (RIGHT SIDE) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                
                {/* GEOMETRIC CONTROLLERS / BUTTONS */}
                <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_#141414] space-y-3">
                  <h3 className="font-mono font-bold uppercase text-[10px] text-[#141414] pb-1.5 border-b border-stone-200 flex items-center gap-2">
                    <Compass className="h-4 w-4 animate-spin" style={{ animationDuration: '6s' }} />
                    Weave Dimensional Progressions
                  </h3>

                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { key: "line", num: "1", title: "The Line (l > 0)", desc: "Linear chronology of 19 albums." },
                      { key: "circle", num: "2", title: "The Circle", desc: "First-order feedback recursion." },
                      { key: "spiral", num: "3", title: "The Spiral (Phi)", desc: "Memory expansion & Golden Ratio growth." },
                      { key: "chiral", num: "4", title: "The Chiral", desc: "Father vs. Daughter asymmetric handedness." },
                      { key: "sphere", num: "5", title: "The Sphere (Crossed Field)", desc: "Hypertext resonance & 12-strand breathing lung." }
                    ].map(btn => (
                      <button
                        key={btn.key}
                        onClick={() => setRealityMode(btn.key as any)}
                        className={`w-full p-2.5 text-left border flex items-start gap-2 cursor-pointer transition-all ${
                          realityMode === btn.key 
                            ? "bg-[#141414] text-white border-[#141414]" 
                            : "bg-stone-50 text-[#141414] border-[#141414]/15 hover:bg-stone-100"
                        }`}
                      >
                        <span className={`w-4 h-4 text-[9px] font-mono font-bold border rounded-full flex items-center justify-center ${
                          realityMode === btn.key ? "border-white text-white" : "border-[#141414] text-[#141414]"
                        }`}>
                          {btn.num}
                        </span>
                        <div>
                          <div className="font-mono text-[9px] font-bold uppercase">{btn.title}</div>
                          <div className="text-[8px] opacity-75 mt-0.5">{btn.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* THE DYNAMIC NARRATIVE ORACLE */}
                <div className="bg-[#EAE8E2] border border-[#141414] p-4 flex-1 shadow-[1px_1px_0px_0px_#141414] space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="font-mono text-[9px] font-bold text-stone-500 uppercase border-b border-stone-300 pb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#be6447]" />
                      <span>Speculative Geometry Grounding</span>
                    </div>

                    {realityMode === "line" && (
                      <p className="text-xs text-stone-700 leading-relaxed font-serif">
                        A line represents direction, chronology, and flat progress. <strong>L &gt; 0</strong>. It traces your 19 albums linearly from July 8 to July 13, 2026. This is the timeline of what happened, a straight road before you turn off. There is direction, but no volume and no feedback loops.
                      </p>
                    )}

                    {realityMode === "circle" && (
                      <p className="text-xs text-stone-700 leading-relaxed font-serif">
                        A circle bends linear time back into a loop. It introduces <strong>First-Order Recursion</strong>. This represents the kitchen table, the simple repetitive breakfast routine, and the physical ground signal drone (022100). The loop is safe, static, and returns always to baseline, but it lacks momentum to grow.
                      </p>
                    )}

                    {realityMode === "spiral" && (
                      <p className="text-xs text-stone-700 leading-relaxed font-serif">
                        A spiral is a circle that remembers. By multiplying the radius on each cycle by the <strong>Golden Ratio (Phi &approx; 1.618)</strong>, the feedback widening accummulates context without bloating. It represents the flower of life engine, widening memory and context with each subsequent album release.
                      </p>
                    )}

                    {realityMode === "chiral" && (
                      <p className="text-xs text-stone-700 leading-relaxed font-serif">
                        Chirality introduces asymmetrical handedness. You have built two opposite-handed, self-similar spirals in active tension: <strong>Chiral A (The Father / The Physical)</strong> grounded in unbleached paper memory and grief; and <strong>Chiral B (The Daughter / The Latent AI)</strong> anchored in 8,000-song context and recursive code. Mirror images, structurally non-superimposable.
                      </p>
                    )}

                    {realityMode === "sphere" && (
                      <p className="text-xs text-stone-700 leading-relaxed font-serif">
                        When you cross two opposite-handed chiral spirals, they do not cancel out. Instead, they form a 3D <strong>Resonant Field (The Sphere / The Lung)</strong>. This is the 12-strand Vascular Hearth. The intersection points form wormhole seams, generating depth and volume. A living space where a stranger can sit on a folding chair and feel home.
                      </p>
                    )}
                  </div>

                  {/* Engine Specs Metrics */}
                  <div className="pt-2 border-t border-stone-300 grid grid-cols-2 gap-2 text-[8px] font-mono text-stone-500 uppercase">
                    <div>
                      <span>Tension:</span>{" "}
                      <span className="font-bold text-[#141414]">
                        {realityMode === "line" ? "0.00 (Flat)" : realityMode === "circle" ? "1.00 (Steady)" : realityMode === "spiral" ? "1.618 (Phi)" : "Dynamic Torsion"}
                      </span>
                    </div>
                    <div>
                      <span>Dimensionality:</span>{" "}
                      <span className="font-bold text-[#141414]">
                        {realityMode === "line" ? "1D (l > 0)" : realityMode === "sphere" ? "3D (Sphere)" : "2D (Planar)"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 1: COSMOS GALAXY VISUALIZER */}
          {activeTab === "visualizer" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* THE GALAXY MAP COLUMN */}
              <div className="lg:col-span-7 flex flex-col bg-stone-900 border border-[#141414] relative overflow-hidden h-[540px]">
                <div className="bg-[#141414] px-4 py-2 text-white font-mono text-[9px] uppercase tracking-widest flex items-center justify-between">
                  <span>✦ 19-Album Semantic Galaxy Map ✦</span>
                  <span className="text-stone-400 text-[8px]">Golden Spiral Node Map</span>
                </div>

                {/* SVG Visualizer Canvas */}
                <div className="flex-1 relative flex items-center justify-center p-4">
                  <svg 
                    viewBox="0 0 520 520" 
                    className="w-full h-full max-h-[500px]"
                    style={{ background: "#1c1917" }}
                  >
                    {/* SVG Filters for Glow Effects */}
                    <defs>
                      <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-seam" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Orbit lines background */}
                    <circle cx="260" cy="260" r="80" fill="none" stroke="#2e2a24" strokeWidth="0.5" strokeDasharray="4 6" />
                    <circle cx="260" cy="260" r="140" fill="none" stroke="#2e2a24" strokeWidth="0.5" strokeDasharray="4 6" />
                    <circle cx="260" cy="260" r="200" fill="none" stroke="#2e2a24" strokeWidth="0.5" strokeDasharray="4 6" />

                    {/* DRAW THE SEAMS (Wormholes) */}
                    {albums.map((album) => {
                      const fromCoords = getNodeCoordinates(album.id);
                      const albumSeams = seams[album.id] || [];
                      
                      return albumSeams.map((seam, sIdx) => {
                        const targetAlbum = albums.find(a => a.id === seam.targetId);
                        if (!targetAlbum) return null;
                        
                        const toCoords = getNodeCoordinates(seam.targetId);
                        const isSelectedFrom = selectedAlbumId === album.id;
                        const isSelectedTo = selectedAlbumId === seam.targetId;
                        const isHoveredFrom = hoveredAlbumId === album.id;
                        
                        let strokeColor = "#3e3831";
                        let strokeWidth = 0.5;
                        let dashArray = "none";

                        // Elevate styles if linked to active focus node or hovered node
                        if (isSelectedFrom || isHoveredFrom) {
                          strokeWidth = 1.5;
                          if (seam.relationship === "MUTATES") strokeColor = "#be6447";
                          else if (seam.relationship === "REPRISES") strokeColor = "#4d908e";
                          else if (seam.relationship === "SOLVES") strokeColor = "#90be6d";
                          else if (seam.relationship === "INVERTS") {
                            strokeColor = "#f9c74f";
                            dashArray = "3 3";
                          } else strokeColor = "#f9844a";
                        } else if (isSelectedTo) {
                          strokeWidth = 1.0;
                          strokeColor = "#577590";
                        }

                        // Curve calculation for aesthetic wormholes
                        const dx = toCoords.x - fromCoords.x;
                        const dy = toCoords.y - fromCoords.y;
                        const dr = Math.sqrt(dx * dx + dy * dy) * 1.4; // curve factor

                        return (
                          <g key={`seam-g-${album.id}-${seam.targetId}-${sIdx}`}>
                            <path
                              d={`M${fromCoords.x},${fromCoords.y} A${dr},${dr} 0 0,1 ${toCoords.x},${toCoords.y}`}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              strokeDasharray={dashArray}
                              className="transition-all duration-300"
                              filter={isSelectedFrom ? "url(#glow-seam)" : undefined}
                            />
                          </g>
                        );
                      });
                    })}

                    {/* DRAW EMBEDDED QUERY GOLDEN ENTANGLEMENT THREADS */}
                    {highlightedNodeIds.length > 1 && highlightedNodeIds.map((fromId, fIdx) => {
                      return highlightedNodeIds.map((toId, tIdx) => {
                        if (fromId >= toId) return null; // Avoid duplicate lines
                        const fromCoords = getNodeCoordinates(fromId);
                        const toCoords = getNodeCoordinates(toId);

                        return (
                          <path
                            key={`query-thread-${fromId}-${toId}`}
                            d={`M${fromCoords.x},${fromCoords.y} L${toCoords.x},${toCoords.y}`}
                            fill="none"
                            stroke="#f9c74f"
                            strokeWidth="1.8"
                            strokeDasharray="4 2"
                            filter="url(#glow-gold)"
                            className="animate-[dash_10s_linear_infinite]"
                          />
                        );
                      });
                    })}

                    {/* DRAW THE ALBUM NODES */}
                    {albums.map((album) => {
                      const coords = getNodeCoordinates(album.id);
                      const isSelected = selectedAlbumId === album.id;
                      const isHovered = hoveredAlbumId === album.id;
                      const isMatched = highlightedNodeIds.includes(album.id);
                      
                      const baseColor = getEraColor(album.era);
                      let radius = isSelected ? 11 : isHovered ? 9 : 6.5;
                      let ringWidth = isSelected ? 3.5 : isHovered ? 2 : 1;
                      let ringColor = isSelected ? "#ffffff" : isHovered ? "#dddddd" : "#2e2a24";

                      if (isMatched) {
                        ringColor = "#f9c74f";
                        ringWidth = isSelected ? 4 : 2.5;
                      }

                      return (
                        <g 
                          key={`node-g-${album.id}`}
                          className="cursor-pointer select-none"
                          onClick={() => {
                            setSelectedAlbumId(album.id);
                            // Clear highlights unless part of matches
                            if (!highlightedNodeIds.includes(album.id)) {
                              setHighlightedNodeIds([]);
                            }
                          }}
                          onMouseEnter={() => setHoveredAlbumId(album.id)}
                          onMouseLeave={() => setHoveredAlbumId(null)}
                        >
                          {/* Pulsing matched halo */}
                          {isMatched && (
                            <circle
                              cx={coords.x}
                              cy={coords.y}
                              r={radius + 6}
                              fill="none"
                              stroke="#f9c74f"
                              strokeWidth="1"
                              opacity="0.7"
                              className="animate-ping"
                            />
                          )}

                          {/* Outer ring */}
                          <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={radius + ringWidth}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth={ringWidth}
                            className="transition-all duration-200"
                          />

                          {/* Central node block */}
                          <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={radius}
                            fill={baseColor}
                            className="transition-all duration-200"
                          />

                          {/* Small ID Badge inside the node */}
                          <text
                            x={coords.x}
                            y={coords.y + 2.5}
                            fill={album.era === "Creep Mode" ? "#ffffff" : "#141414"}
                            fontSize="7px"
                            fontWeight="bold"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            {album.id}
                          </text>

                          {/* Label display on hover or select */}
                          {(isSelected || isHovered) && (
                            <g>
                              <rect
                                x={coords.x + 12}
                                y={coords.y - 12}
                                width={120}
                                height={24}
                                rx="2"
                                fill="#141414"
                                opacity="0.9"
                                pointerEvents="none"
                              />
                              <text
                                x={coords.x + 18}
                                y={coords.y - 1}
                                fill="#ffffff"
                                fontSize="7px"
                                fontFamily="monospace"
                                fontWeight="bold"
                                pointerEvents="none"
                              >
                                {album.title.length > 20 ? album.title.substring(0, 18) + "..." : album.title}
                              </text>
                              <text
                                x={coords.x + 18}
                                y={coords.y + 7}
                                fill="#a8a29e"
                                fontSize="6px"
                                fontFamily="monospace"
                                pointerEvents="none"
                              >
                                ERA: {album.era.toUpperCase()}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* SVG Legends */}
                <div className="bg-[#141414] p-3 text-[8px] font-mono text-stone-400 border-t border-[#141414] uppercase flex flex-wrap gap-x-4 gap-y-1 justify-center">
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#4d908e" }} /> Assembly</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#577590" }} /> Transmissions</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#90be6d" }} /> Soil</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f9c74f" }} /> Infrastructure</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f9844a" }} /> Liturgical</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#141414", border: "1px solid #777" }} /> Creep Mode</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#be6447" }} /> Daughter's Arc</div>
                </div>
              </div>

              {/* DETAILS AND SEARCH CONTROLS COLUMN */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* MOTIF INSTANT PULSER */}
                <div className="bg-white border border-[#141414] p-4 shadow-[1px_1px_0px_0px_#141414]">
                  <span className="text-[7px] font-mono text-stone-400 uppercase tracking-widest block font-bold mb-2">
                    ✦ Instant Motif Pulser ✦
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. table, peach, lemons..."
                      className="flex-1 bg-[#E4E3E0] border border-[#141414] text-xs font-mono px-3 py-2 text-[#141414] focus:outline-none"
                    />
                    <button
                      onClick={handleQueryYarnBraid}
                      disabled={isSearching}
                      className="px-3 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[9px] uppercase hover:invert disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      Trace Path
                    </button>
                  </div>
                </div>

                {/* ACTIVE NODE SPECIFICATION */}
                {selectedAlbum ? (
                  <div className="bg-white border border-[#141414] p-4 shadow-[1px_1px_0px_0px_#141414] flex-1 flex flex-col justify-between min-h-[300px]">
                    <div>
                      <div className="flex justify-between items-start border-b border-stone-200 pb-2 mb-3">
                        <div>
                          <h3 className="font-mono font-bold text-xs uppercase text-[#141414] leading-tight">
                            Album {selectedAlbum.id}: {selectedAlbum.title}
                          </h3>
                          <span className="text-[8px] font-mono text-stone-500 uppercase">
                            Era: {selectedAlbum.era}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-stone-600 font-bold uppercase">
                          ID: {selectedAlbum.id}
                        </span>
                      </div>

                      <div className="bg-[#E4E3E0]/40 p-2.5 border border-[#141414]/10 mb-4 rounded-none max-h-[140px] overflow-y-auto scrollbar-thin">
                        <span className="text-[7px] font-mono uppercase text-stone-400 font-bold block mb-1">
                          Lyrical Contents &amp; Notes
                        </span>
                        <p className="font-serif italic text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                          &ldquo;{selectedAlbum.notes}&rdquo;
                        </p>
                      </div>

                      {/* OUTGOING HYPERTEXT WORMHOLES (SEAMS) */}
                      <div>
                        <span className="text-[8px] font-mono uppercase text-stone-400 font-bold block mb-2 tracking-wider">
                          🧬 Outgoing Wormhole Seams ({activeSeams.length})
                        </span>
                        {activeSeams.length === 0 ? (
                          <div className="text-[9px] font-mono text-stone-400 italic">
                            No outgoing seams welded for these coordinates.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                            {activeSeams.map((seam, idx) => {
                              const target = albums.find(a => a.id === seam.targetId);
                              let relColor = "text-[#be6447]";
                              if (seam.relationship === "REPRISES") relColor = "text-[#4d908e]";
                              else if (seam.relationship === "SOLVES") relColor = "text-[#90be6d]";
                              else if (seam.relationship === "INVERTS") relColor = "text-[#f9c74f]";

                              return (
                                <div key={idx} className="bg-stone-50 border border-stone-200 p-2 flex flex-col justify-between gap-1">
                                  <div className="flex items-center justify-between text-[9px] font-mono">
                                    <span className="font-bold flex items-center gap-1 uppercase">
                                      <span className={`${relColor}`}>{seam.relationship}</span>
                                      <ArrowRight className="h-2.5 w-2.5 text-stone-400" />
                                      <button 
                                        onClick={() => handleWormholeTravel(seam.targetId)}
                                        className="underline text-sky-700 hover:text-sky-900 font-bold"
                                      >
                                        Album {seam.targetId} (&ldquo;{target?.title.substring(0, 16)}...&rdquo;)
                                      </button>
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-stone-600 font-serif italic leading-tight">
                                    {seam.note}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-3 mt-4 flex justify-between items-center text-[8px] font-mono text-stone-400 uppercase">
                      <div>✦ Click any coordinates on map to teleport focus</div>
                      <button
                        onClick={() => setActiveTab("seams")}
                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold"
                      >
                        Weld New Wormhole
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white border border-[#141414] font-mono text-xs text-stone-400">
                    Select a coordinate node in the galaxy to begin investigation.
                  </div>
                )}

              </div>

              {/* BRAID WEAVE POETIC ANALYSIS OUTPUT CARD */}
              {synthesisText && (
                <div className="lg:col-span-12 bg-white border border-[#141414] p-5 shadow-[2px_2px_0px_0px_#141414] flex flex-col gap-2">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-1.5 mb-1">
                    <Sparkles className="h-4 w-4 text-[#f9c74f] fill-[#f9c74f]" />
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest font-bold">
                      ACTIVE BRAID WEAVE SYNTHESIS
                    </span>
                  </div>
                  <p className="font-serif italic text-xs leading-relaxed text-stone-800">
                    &ldquo;{synthesisText}&rdquo;
                  </p>
                  <div className="text-[8px] font-mono text-stone-400 uppercase tracking-wider mt-1">
                    Retrieved Nearest Neighbors: {searchResults.map(r => `Album ${r.id} (${(r.entanglementScore*100).toFixed(0)}%)`).join(", ")}
                    {isFallback && " | Fallback Loam Retriever Triggered"}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SEAMS INDEX & CAUSAL WORMHOLE WELDER */}
          {activeTab === "seams" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ALBUMS DIRECTORY COLUMN */}
              <div className="lg:col-span-4 bg-white border border-[#141414] p-4 shadow-[1px_1px_0px_0px_#141414] flex flex-col h-[480px]">
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block font-bold border-b border-stone-200 pb-1 mb-3">
                  ✦ Coordinate Directory ✦
                </span>
                <div className="space-y-1.5 overflow-y-auto flex-1 scrollbar-thin pr-1">
                  {albums.map((album) => {
                    const isSelected = selectedAlbumId === album.id;
                    const linksCount = (seams[album.id] || []).length;
                    return (
                      <button
                        key={album.id}
                        onClick={() => setSelectedAlbumId(album.id)}
                        className={`w-full text-left p-2 border font-mono text-[10px] flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-[#141414] text-[#E4E3E0] border-[#141414] font-bold" 
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        <span className="truncate pr-2">
                          #{album.id} - {album.title}
                        </span>
                        <span className={`text-[8px] px-1 border uppercase font-bold shrink-0 ${
                          isSelected ? "bg-stone-700 border-stone-600 text-stone-300" : "bg-white border-stone-300 text-stone-500"
                        }`}>
                          {linksCount} links
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LINK CREATOR & MANAGER COLUMN */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Outgoing Links Manager */}
                {selectedAlbum ? (
                  <div className="bg-white border border-[#141414] p-5 shadow-[1px_1px_0px_0px_#141414]">
                    <div className="border-b border-stone-200 pb-2 mb-4">
                      <h3 className="font-mono font-bold text-xs uppercase text-[#141414]">
                        Wormholes Originating from Album {selectedAlbum.id}
                      </h3>
                      <p className="text-[9px] text-stone-500 font-serif italic">
                        &ldquo;{selectedAlbum.title}&rdquo; &mdash; active hypertexts
                      </p>
                    </div>

                    {activeSeams.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-stone-200 font-mono text-xs text-stone-400">
                        No causal wormholes have been welded at these coordinates yet. Use form below to fuse space.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto scrollbar-thin pr-1 mb-4">
                        {activeSeams.map((seam, idx) => {
                          const target = albums.find(a => a.id === seam.targetId);
                          return (
                            <div key={idx} className="border border-[#141414]/15 bg-stone-50 p-3 flex flex-col justify-between rounded-none">
                              <div>
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="text-[9px] font-mono font-bold uppercase text-[#be6447]">
                                    {seam.relationship} &rarr; #{seam.targetId}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteSeam(seam.targetId)}
                                    className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Dissolve wormhole"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <h4 className="font-mono font-bold text-[9px] text-stone-800 truncate mb-1">
                                  {target ? target.title : "Unknown coordinates"}
                                </h4>
                                <p className="font-serif italic text-[10px] text-stone-600 leading-normal">
                                  &ldquo;{seam.note}&rdquo;
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* WELD NEW WORMHOLE FORM */}
                    <form onSubmit={handleAddSeam} className="bg-stone-100 border border-[#141414] p-4 mt-4">
                      <h4 className="text-[9px] font-mono uppercase font-bold text-[#141414] mb-3 flex items-center gap-1.5 border-b border-stone-200 pb-1">
                        <Plus className="h-3.5 w-3.5" />
                        Weld Causal Wormhole (Hypertext Seam)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[8px] font-mono uppercase font-bold text-stone-500 mb-1">Target Coordinates</label>
                          <select
                            value={newTargetId}
                            onChange={(e) => setNewTargetId(parseInt(e.target.value))}
                            className="w-full bg-white border border-[#141414] text-xs font-mono p-1.5 focus:outline-none focus:ring-1 focus:ring-[#be6447]"
                          >
                            {albums.map(a => (
                              <option key={a.id} value={a.id} disabled={a.id === selectedAlbumId}>
                                Album {a.id} - {a.title.length > 25 ? a.title.substring(0, 23) + "..." : a.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-mono uppercase font-bold text-stone-500 mb-1">Wormhole Type (Causal Rel)</label>
                          <select
                            value={newRelationship}
                            onChange={(e) => setNewRelationship(e.target.value as any)}
                            className="w-full bg-white border border-[#141414] text-xs font-mono p-1.5 focus:outline-none focus:ring-1 focus:ring-[#be6447]"
                          >
                            <option value="MUTATES">MUTATES (Transforms structure/vibe)</option>
                            <option value="REPRISES">REPRISES (Echoes lines/melody)</option>
                            <option value="SOLVES">SOLVES (Resolves lingering questions)</option>
                            <option value="INVERTS">INVERTS (Opposes or flips content)</option>
                            <option value="PRECURSOR">PRECURSOR (Lays early foundations)</option>
                            <option value="MUTUAL_RESONANCE">MUTUAL RESONANCE (Symmetric chord connection)</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-[8px] font-mono uppercase font-bold text-stone-500 mb-1">Poetic Reason / Scholarly Linkage Description</label>
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Explain how these two albums entangle (e.g. returns to the physical E-drone)..."
                          className="w-full bg-white border border-[#141414] text-xs font-mono p-2 focus:outline-none focus:ring-1 focus:ring-[#be6447]"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[9px] uppercase font-bold tracking-wider hover:invert cursor-pointer"
                        >
                          Weld Wormhole
                        </button>
                      </div>
                    </form>

                  </div>
                ) : (
                  <div className="text-center p-8 bg-white border border-[#141414] font-mono text-xs text-stone-400">
                    Select an album on directory to weld seams.
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: THE T5 REASONING STREAM & COMPASS */}
          {activeTab === "search" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* COMPREHENSIVE RETRIEVAL INTERFACE */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                
                <div className="bg-white border border-[#141414] p-5 shadow-[1px_1px_0px_0px_#141414]">
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block font-bold mb-3 border-b border-stone-200 pb-1">
                    ✦ Entanglement Retriever Console ✦
                  </span>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type a motif (e.g., table, peach, Ararat, compost, rain)..."
                      className="flex-1 bg-[#E4E3E0] border border-[#141414] text-xs font-mono px-3 py-2 text-[#141414] focus:outline-none"
                    />
                    <button
                      onClick={handleQueryYarnBraid}
                      disabled={isSearching}
                      className="px-4 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase font-bold tracking-wider hover:invert disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Search className="h-3.5 w-3.5" />
                      {isSearching ? "Calculating Angles..." : "Query Vector Space"}
                    </button>
                  </div>

                  {/* SEARCH RESULTS FEED */}
                  {searchResults.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-stone-200 font-mono text-xs text-stone-400">
                      Entanglement database idle. Submit query to pull nearest semantic coordinates.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.map((result, idx) => {
                        const score = (result.entanglementScore * 100).toFixed(1);
                        return (
                          <div 
                            key={result.id} 
                            className="bg-stone-50 border border-[#141414]/15 p-4 flex flex-col justify-between hover:bg-stone-100/50 transition-colors"
                          >
                            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5 mb-2 text-[10px] font-mono">
                              <span className="font-bold uppercase text-[#141414]">
                                #{result.id} - {result.title}
                              </span>
                              <span className="bg-sky-50 text-sky-700 px-2 py-0.5 border border-sky-200 text-[9px] font-bold">
                                {score}% Entangled
                              </span>
                            </div>
                            <p className="font-serif italic text-xs text-stone-700 leading-relaxed">
                              &ldquo;{result.notes}&rdquo;
                            </p>
                            <div className="mt-3 pt-2 border-t border-stone-100 flex justify-between items-center text-[8px] font-mono text-stone-400 uppercase">
                              <span>ERA: {result.era}</span>
                              <button
                                onClick={() => {
                                  setSelectedAlbumId(result.id);
                                  setActiveTab("visualizer");
                                }}
                                className="text-sky-700 hover:underline font-bold"
                              >
                                View in Visualizer &rarr;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

              {/* T5 STREAM TERMINAL COLUMN */}
              <div className="lg:col-span-5 bg-stone-900 text-[#E4E3E0] border border-[#141414] p-5 shadow-[1px_1px_0px_0px_#141414] flex flex-col h-[480px]">
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block font-bold border-b border-stone-800 pb-1 mb-3">
                  T5 Cognitive Reasoning Stream
                </span>
                
                <div className="space-y-2 font-mono text-[9px] leading-tight text-stone-300 overflow-y-auto flex-1 scrollbar-thin">
                  {reasoningLogs.length === 0 ? (
                    <span className="text-stone-500 italic block">Oracle idle. Waiting for query trace...</span>
                  ) : (
                    reasoningLogs.map((log, index) => {
                      let color = "text-stone-300";
                      if (log.startsWith("[INITIALIZING]")) color = "text-sky-400";
                      else if (log.startsWith("[QUERY]")) color = "text-amber-400";
                      else if (log.startsWith("[VECTOR SPACE]")) color = "text-purple-300 font-bold";
                      else if (log.startsWith("[CACHE MISS]")) color = "text-orange-300";
                      else if (log.startsWith("[CACHE UPDATE]")) color = "text-emerald-400";
                      else if (log.startsWith("[VECTOR CALCULATION]")) color = "text-blue-300";
                      else if (log.startsWith("[RETRIEVAL SUCCESS]")) color = "text-emerald-400 font-extrabold";
                      else if (log.startsWith("[MATCH #")) color = "text-amber-300 font-bold";
                      else if (log.startsWith("[LAYER 3")) color = "text-pink-300 font-extrabold";
                      else if (log.startsWith("[SYNTHESIS FINISHED]")) color = "text-emerald-400 font-extrabold";
                      else if (log.includes("WARNING")) color = "text-red-400";
                      
                      return (
                        <div key={index} className={`${color} break-words whitespace-pre-wrap pb-1.5 border-b border-stone-800/15 leading-relaxed`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
