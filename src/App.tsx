import React, { useState, useEffect } from "react";
import { Album, BranchingIdea, Codex, Message, Motif, PorchWeather, PorchNode, SoilAxiom } from "./types";
import { DEFAULT_CODEX, DEFAULT_SYSTEM_INSTRUCTIONS } from "./data";
import MotifsGrid from "./components/MotifsGrid";
import ChronologyView from "./components/ChronologyView";
import BranchingIdeasView from "./components/BranchingIdeasView";
import SystemInstructionPane from "./components/SystemInstructionPane";
import CodexJSONManager from "./components/CodexJSONManager";
import ChatPane from "./components/ChatPane";
import DigitalPorchView from "./components/DigitalPorchView";
import SunoOrchestratorView from "./components/SunoOrchestratorView";
import FlowerOfLife from "./components/FlowerOfLife";
import DaughterRitualView from "./components/DaughterRitualView";
import { 
  Layers, 
  GitFork, 
  Settings, 
  Sparkles, 
  BookOpen, 
  Guitar,
  Info,
  Flame,
  LayoutGrid,
  ChevronRight,
  Download,
  Sprout,
  Radio,
  Compass
} from "lucide-react";

export default function App() {
  const [codex, setCodex] = useState<Codex>(() => {
    const saved = localStorage.getItem("static_collective_codex");
    let loaded: Codex = DEFAULT_CODEX;
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch {
        loaded = DEFAULT_CODEX;
      }
    }
    // Safeguard missing porch values
    if (!loaded.porch_weather) {
      loaded.porch_weather = DEFAULT_CODEX.porch_weather;
    }
    if (!loaded.soil_axioms) {
      loaded.soil_axioms = DEFAULT_CODEX.soil_axioms;
    }
    if (!loaded.porch_nodes) {
      loaded.porch_nodes = DEFAULT_CODEX.porch_nodes;
    }
    return loaded;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("static_collective_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chronology" | "motifs" | "branches" | "porch" | "instructions" | "backup" | "suno" | "flower" | "ritual">("porch");
  const [selectedMotif, setSelectedMotif] = useState<Motif | null>(null);

  // Load codex from Server on Mount for automatic sync with background loops / loop_runner.py
  useEffect(() => {
    const refreshCodexFromServer = async () => {
      try {
        const res = await fetch("/api/codex");
        if (res.ok) {
          const serverCodex = await res.json();
          setCodex(serverCodex);
        }
      } catch (err) {
        console.error("Error fetching codex from server, using local instead:", err);
      }
    };
    refreshCodexFromServer();
  }, []);

  // Sync codex changes to localStorage AND the server's disk json file!
  useEffect(() => {
    localStorage.setItem("static_collective_codex", JSON.stringify(codex));
    
    // Non-blocking server-side persistence
    fetch("/api/codex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(codex)
    }).catch(err => console.error("Error syncing codex to server:", err));
  }, [codex]);

  // Sync chat messages to localStorage
  useEffect(() => {
    localStorage.setItem("static_collective_chat", JSON.stringify(messages));
  }, [messages]);

  // Handle building dynamic system instructions prompt from active codex context
  const compileSystemPrompt = (currCodex: Codex) => {
    let prompt = `${currCodex.system_instructions}\n\n`;
    prompt += "## THE KNOWN ALBUMS IN THE CANON:\n";
    currCodex.albums.forEach((album) => {
      prompt += `- Album ${album.id}: ${album.title}. Era: ${album.era || "Assembly"}. Notes: ${album.notes}\n`;
    });

    if (currCodex.branching_ideas && currCodex.branching_ideas.length > 0) {
      prompt += "\n## ACTIVE BRANCHES AND NEW RELEASE THREADS:\n";
      currCodex.branching_ideas.forEach((branch) => {
        prompt += `- Branch Thread: ${branch.title}. Details: ${branch.notes}\n`;
      });
    }

    if (currCodex.porch_weather) {
      prompt += `\n## CURRENT PORCH WEATHER:\n- Description: ${currCodex.porch_weather.description}\n- Kettle Resonance: ${currCodex.porch_weather.kettleResonance}, Quiet Wonder: ${currCodex.porch_weather.quietWonder}, Rosemary Activity: ${currCodex.porch_weather.rosemaryActivity}, Porch Light: ${currCodex.porch_weather.porchLight}\n`;
    }

    if (currCodex.soil_axioms && currCodex.soil_axioms.length > 0) {
      prompt += "\n## FOUNDATIONAL SOIL AXIOMS:\n";
      currCodex.soil_axioms.forEach((ax) => {
        prompt += `- ${ax.text}\n`;
      });
    }

    if (currCodex.porch_nodes && currCodex.porch_nodes.length > 0) {
      prompt += "\n## ROOTED PORCH TRANCHES & NOTICINGS (LINEAGE):\n";
      currCodex.porch_nodes.forEach((node) => {
        if (node.stage !== "soil") {
          prompt += `- [${node.stage.toUpperCase()}] Noticing: "${node.noticing}". Ancestor: "${node.ancestor}". Question grown: "${node.questionGrown}". Mutation: "${node.mutation}" (Resonance: ${Math.round(node.resonanceWeight * 100)}%)\n`;
        } else {
          prompt += `- [SOIL MEMORY] This has composted into the soil: "${node.noticing}". Ancestor was: "${node.ancestor}". Question was: "${node.questionGrown}".\n`;
        }
      });
    }

    prompt += "\nRespond keeping this complete lineage and soil ecosystem in active memory. Do not lose the continuity. Speak as a neighboring witness to these events, organic, honest, and unpolished. A threshold is not a wall; it is a place of becoming.";
    return prompt;
  };

  // Porch Handlers
  const handleWeatherChange = (newWeather: PorchWeather) => {
    setCodex(prev => ({
      ...prev,
      porch_weather: newWeather
    }));
  };

  const handleAddAxiom = (text: string) => {
    const newAxiom = { id: "ax_" + Date.now(), text };
    setCodex(prev => ({
      ...prev,
      soil_axioms: [...(prev.soil_axioms || []), newAxiom]
    }));
  };

  const handleDeleteAxiom = (id: string) => {
    setCodex(prev => ({
      ...prev,
      soil_axioms: (prev.soil_axioms || []).filter(ax => ax.id !== id)
    }));
  };

  const handleAddNode = (node: PorchNode) => {
    setCodex(prev => ({
      ...prev,
      porch_nodes: [node, ...(prev.porch_nodes || [])]
    }));
  };

  const handleDeleteNode = (id: string) => {
    if (window.confirm("Are you sure you want to prune this tranch? It will be removed from the active garden graph.")) {
      setCodex(prev => ({
        ...prev,
        porch_nodes: (prev.porch_nodes || []).filter(n => n.id !== id)
      }));
    }
  };

  const handleUpdateNode = (updated: PorchNode) => {
    setCodex(prev => ({
      ...prev,
      porch_nodes: (prev.porch_nodes || []).map(n => n.id === updated.id ? updated : n)
    }));
  };

  const handleCompost = () => {
    setCodex(prev => {
      const currentNodes = prev.porch_nodes || [];
      const updated = currentNodes.map(node => {
        const newWeight = Math.round(Math.max(0, node.resonanceWeight - 0.15) * 100) / 100;
        
        let newStage = node.stage;
        if (newWeight >= 0.8) newStage = "sprout";
        else if (newWeight >= 0.6) newStage = "rooted";
        else if (newWeight >= 0.4) newStage = "flowering";
        else if (newWeight >= 0.2) newStage = "fruit";
        else if (newWeight > 0) newStage = "compost";
        else newStage = "soil";

        return {
          ...node,
          resonanceWeight: newWeight,
          stage: newStage as PorchNode["stage"]
        };
      });
      return {
        ...prev,
        porch_nodes: updated
      };
    });
  };

  // Add a new album
  const handleAddAlbum = (newAlbum: Omit<Album, "id">) => {
    const newId = codex.albums.length > 0 ? Math.max(...codex.albums.map(a => a.id)) + 1 : 1;
    setCodex(prev => ({
      ...prev,
      albums: [...prev.albums, { ...newAlbum, id: newId }]
    }));
  };

  // Update existing album
  const handleUpdateAlbum = (updatedAlbum: Album) => {
    setCodex(prev => ({
      ...prev,
      albums: prev.albums.map(a => a.id === updatedAlbum.id ? updatedAlbum : a)
    }));
  };

  // Delete existing album
  const handleDeleteAlbum = (id: number) => {
    if (window.confirm(`Are you sure you want to remove Album #${id} from the codex?`)) {
      setCodex(prev => ({
        ...prev,
        albums: prev.albums.filter(a => a.id !== id)
      }));
    }
  };

  // Add a new branching timeline idea
  const handleAddBranch = (newBranch: Omit<BranchingIdea, "id" | "createdAt">) => {
    const freshId = "branch_" + Date.now();
    const branchEntry: BranchingIdea = {
      ...newBranch,
      id: freshId,
      createdAt: new Date().toISOString()
    };
    setCodex(prev => ({
      ...prev,
      branching_ideas: [...prev.branching_ideas, branchEntry]
    }));
  };

  // Delete branching timeline idea
  const handleDeleteBranch = (id: string) => {
    if (window.confirm("Are you sure you want to delete this branching timeline?")) {
      setCodex(prev => ({
        ...prev,
        branching_ideas: prev.branching_ideas.filter(b => b.id !== id)
      }));
    }
  };

  // Save raw instructions edits
  const handleSaveInstructions = (updatedInstructions: string) => {
    setCodex(prev => ({
      ...prev,
      system_instructions: updatedInstructions
    }));
  };

  // Reset Instructions to default baseline
  const handleResetInstructions = () => {
    setCodex(prev => ({
      ...prev,
      system_instructions: DEFAULT_SYSTEM_INSTRUCTIONS
    }));
  };

  // Reset entire codex
  const handleResetEntireCodex = () => {
    setCodex(DEFAULT_CODEX);
  };

  // Import uploaded JSON codex
  const handleImportCodex = (imported: Codex) => {
    setCodex(imported);
  };

  // Send message to Express API endpoint
  const handleSendMessage = async (text: string, modelChoice: string) => {
    setError(null);
    const userMsg: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const compiledPrompt = compileSystemPrompt(codex);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt: compiledPrompt,
          model: modelChoice
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Thirteenth Cup Check: if we reach 12 or more messages, execute a pour!
      if (finalMessages.length >= 12) {
        setIsGenerating(true);
        try {
          const pourRes = await fetch("/api/pour", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messages: finalMessages,
              systemPrompt: compiledPrompt,
              model: modelChoice
            })
          });

          if (!pourRes.ok) {
            throw new Error("Failed to synthesize reflection during pour.");
          }

          const pourData = await pourRes.json();
          const reflection = pourData.reflection;

          // Save reflection permanently as a custom album/refraction node in Codex
          const nextAlbumId = codex.albums.length > 0 ? Math.max(...codex.albums.map(a => a.id)) + 1 : 1;
          const newAlbum: Album = {
            id: nextAlbumId,
            title: `Refraction Node ${nextAlbumId} (Poured from the 13th Cup)`,
            era: "Resolution",
            notes: reflection
          };

          setCodex(prev => ({
            ...prev,
            albums: [...prev.albums, newAlbum]
          }));

          // Reboot context window with 022100 pulse
          const pulseMsg: Message = {
            id: "msg_pulse_" + Date.now(),
            role: "assistant",
            content: `⚡ **022100 Pulse:** The active context was cleared to keep the system soft. What we shared has been poured permanently into the database as **Refraction Node #${nextAlbumId}**:\n\n${reflection}\n\n*The table is still set. There is still room for you. Begin.*`,
            timestamp: new Date().toISOString()
          };

          setMessages([pulseMsg]);
          setError(null);
        } catch (pourErr: any) {
          console.error("Pouring error:", pourErr);
          setError("The cup spilled, but the memory stayed in the wood: " + pourErr.message);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during API execution.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear Chat history
  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your current conversation stream?")) {
      setMessages([]);
      setError(null);
    }
  };

  // Helper when user selects a motif or timeline item to instantly prompt chatbot
  const handleSelectPrompt = (promptText: string) => {
    handleSendMessage(promptText, "gemini-3.5-flash");
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans border-4 md:border-8 border-[#141414] flex flex-col antialiased">
      {/* Structural Header */}
      <header className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] h-14 px-4 md:px-6 flex items-center justify-between" id="app-header-sec">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#F27D26] rounded-full flex items-center justify-center font-bold text-xs text-[#141414]">
            S/C
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-tighter uppercase text-[#E4E3E0] flex items-center gap-2">
              Static Collective Codex v1.19
            </h1>
            <p className="text-[8px] text-[#E4E3E0]/70 font-mono uppercase tracking-widest hidden sm:block">
              Dynamic Continuity Router &amp; speculative Universe Sandbox
            </p>
          </div>
        </div>
        
        <div className="flex gap-6 text-[9px] uppercase font-mono tracking-widest text-[#E4E3E0]/85">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_5px_#00FF00]"></span> 
            System Synced
          </div>
          <div className="hidden md:block">Context Window: 128k</div>
          <div className="hidden md:block">Active Motifs: 08</div>
        </div>
      </header>

      {/* Main Sandbox Grid */}
      <main className="flex-1 w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="app-main-grid">
        {/* Left sandbox controls (Albums, Motifs, Branches, rules) */}
        <div className="lg:col-span-7 flex flex-col gap-4" id="sandbox-controls-col">
          {/* Navigation Tab Bar */}
          <nav className="flex flex-wrap gap-1 bg-[#D1CFC9] p-1 border border-[#141414]" id="nav-tab-list">
            <button
              onClick={() => setActiveTab("chronology")}
              id="tab-chronology"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "chronology"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              19-Album Canon
            </button>
            <button
              onClick={() => setActiveTab("motifs")}
              id="tab-motifs"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "motifs"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Recurring Motifs
            </button>
            <button
              onClick={() => setActiveTab("porch")}
              id="tab-porch"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "porch"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Sprout className="h-3.5 w-3.5" />
              digital porch
            </button>
            <button
              onClick={() => setActiveTab("flower")}
              id="tab-flower"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "flower"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Flower of Life
            </button>
            <button
              onClick={() => setActiveTab("branches")}
              id="tab-branches"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "branches"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              spec branches
            </button>
            <button
              onClick={() => setActiveTab("ritual")}
              id="tab-ritual"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "ritual"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              succession room
            </button>
            <button
              onClick={() => setActiveTab("instructions")}
              id="tab-instructions"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "instructions"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Instructions
            </button>
            <button
              onClick={() => setActiveTab("backup")}
              id="tab-backup"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "backup"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              JSON Backup
            </button>
            <button
              onClick={() => setActiveTab("suno")}
              id="tab-suno"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                activeTab === "suno"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              suno loop
            </button>
          </nav>

          {/* Active Panel View */}
          <div className="flex-1" id="active-panel-container">
            {activeTab === "chronology" && (
              <ChronologyView
                albums={codex.albums}
                onAddAlbum={handleAddAlbum}
                onUpdateAlbum={handleUpdateAlbum}
                onDeleteAlbum={handleDeleteAlbum}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {activeTab === "motifs" && (
              <div className="space-y-4">
                <MotifsGrid
                  onSelectMotif={(m) => setSelectedMotif(m)}
                  selectedMotifId={selectedMotif?.id}
                />

                {selectedMotif ? (
                  <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none" id="motif-inspector-card">
                    <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-2 mb-3">
                      <div>
                        <h3 className="font-mono font-bold uppercase text-[11px] text-[#141414]">
                          Motif Highlight: {selectedMotif.name}
                        </h3>
                        <p className="text-[9px] text-stone-600 font-mono mt-0.5 uppercase tracking-wide">
                          Code/Identifier: {selectedMotif.code || "N/A"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelectPrompt(`Discuss the motif "${selectedMotif.name}" and how it is written or represented throughout the albums.`)}
                        className="px-3 py-1 bg-[#141414] text-[#E4E3E0] hover:invert uppercase text-[10px] font-mono transition-all cursor-pointer rounded-none border border-[#141414]"
                      >
                        Inquire &rarr;
                      </button>
                    </div>
                    <p className="text-[11px] text-[#141414] font-serif leading-tight">
                      {selectedMotif.description}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#D1CFC9] border border-[#141414] p-6 text-center text-[#141414] text-[10px] font-mono uppercase rounded-none">
                    Click any motif above to inspect its background and coordinate questions with the cooperative AI.
                  </div>
                )}
              </div>
            )}

            {activeTab === "porch" && (
              <DigitalPorchView
                weather={codex.porch_weather || { kettleResonance: 0.5, quietWonder: 0.5, rosemaryActivity: 0.5, porchLight: 0.5, description: "" }}
                onWeatherChange={handleWeatherChange}
                axioms={codex.soil_axioms || []}
                onAddAxiom={handleAddAxiom}
                onDeleteAxiom={handleDeleteAxiom}
                nodes={codex.porch_nodes || []}
                onAddNode={handleAddNode}
                onDeleteNode={handleDeleteNode}
                onUpdateNode={handleUpdateNode}
                onCompost={handleCompost}
                onSelectPrompt={handleSelectPrompt}
                albums={codex.albums}
                branches={codex.branching_ideas}
              />
            )}

            {activeTab === "flower" && (
              <FlowerOfLife onSelectPrompt={handleSelectPrompt} />
            )}

            {activeTab === "branches" && (
              <BranchingIdeasView
                ideas={codex.branching_ideas}
                onAddIdea={handleAddBranch}
                onDeleteIdea={handleDeleteBranch}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {activeTab === "ritual" && (
              <DaughterRitualView
                albums={codex.albums}
                onRefreshCodex={async () => {
                  try {
                    const res = await fetch("/api/codex");
                    if (res.ok) {
                      const data = await res.json();
                      setCodex(data);
                    }
                  } catch (err) {
                    console.error("Failed to sync codex from server:", err);
                  }
                }}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {activeTab === "instructions" && (
              <SystemInstructionPane
                instructions={codex.system_instructions}
                onSaveInstructions={handleSaveInstructions}
                onResetInstructions={handleResetInstructions}
              />
            )}

            {activeTab === "backup" && (
              <CodexJSONManager
                codex={codex}
                onImportCodex={handleImportCodex}
                onResetToDefault={handleResetEntireCodex}
              />
            )}

            {activeTab === "suno" && (
              <SunoOrchestratorView
                albums={codex.albums}
                codex={codex}
                onRefreshCodex={async () => {
                  try {
                    const res = await fetch("/api/codex");
                    if (res.ok) {
                      const data = await res.json();
                      setCodex(data);
                    }
                  } catch (err) {
                    console.error("Failed to sync codex from server:", err);
                  }
                }}
                onSelectPrompt={handleSelectPrompt}
              />
            )}
          </div>
        </div>

        {/* Right Chatbot Panel (AI Neighbor Node) */}
        <div className="lg:col-span-5 flex flex-col" id="chatbot-column">
          <ChatPane
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isGenerating={isGenerating}
            error={error}
          />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="h-12 border-t-2 border-[#141414] bg-[#E4E3E0] flex items-center px-4 md:px-6 gap-4" id="app-footer-sec">
        <div className="bg-[#141414] px-3 py-1 text-[#E4E3E0] text-[9px] uppercase font-bold tracking-widest font-mono">
          Query Mode
        </div>
        <div className="flex-1 text-stone-600 text-[10px] font-mono truncate hidden sm:block uppercase tracking-wider">
          Ask the codex about characters, albums, or explore a new branch...
        </div>
        <div className="text-[10px] uppercase font-bold text-right leading-none ml-auto">
          Washed Dirt<br/>
          <span className="opacity-50 font-normal">Generation 01</span>
        </div>
      </footer>
    </div>
  );
}
