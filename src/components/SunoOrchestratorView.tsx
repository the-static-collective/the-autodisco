import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Play, 
  Volume2, 
  Settings, 
  Music, 
  Download, 
  Check, 
  Loader2, 
  AlertCircle, 
  ListMusic, 
  Radio, 
  ToggleLeft,
  ToggleRight,
  Info,
  Calendar,
  ExternalLink,
  Flame,
  Sprout
} from "lucide-react";
import { Album, Codex } from "../types";

interface SunoTask {
  id: string;
  title: string;
  tags: string;
  lyrics: string;
  status: "queued" | "generating" | "downloading" | "completed" | "failed";
  progress: number;
  audioUrl?: string;
  error?: string;
  createdAt: string;
}

interface SunoConfig {
  sunoApiUrl: string;
  simulationMode: boolean;
}

interface SunoOrchestratorViewProps {
  albums: Album[];
  codex: Codex;
  onRefreshCodex: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export default function SunoOrchestratorView({
  albums,
  codex,
  onRefreshCodex,
  onSelectPrompt
}: SunoOrchestratorViewProps) {
  const [config, setConfig] = useState<SunoConfig | null>(null);
  const [tasks, setTasks] = useState<SunoTask[]>([]);
  const [isOracleTriggering, setIsOracleTriggering] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [customLyrics, setCustomLyrics] = useState("");
  const [isCustomTriggering, setIsCustomTriggering] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info" | null; text: string }>({
    type: null,
    text: ""
  });
  const [activePlaybackUrl, setActivePlaybackUrl] = useState<string | null>(null);
  const [activePlayingTitle, setActivePlayingTitle] = useState<string | null>(null);

  // Fetch initial configuration & active tasks
  useEffect(() => {
    fetchConfig();
    fetchTasks();

    // Poll active tasks every 3.5 seconds
    const interval = setInterval(() => {
      fetchTasks();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/suno/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Error fetching Suno config:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/suno/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        
        // If any task has transitioned to 'completed', refresh our main codex/albums display!
        const hasCompleted = data.some((t: SunoTask) => t.status === "completed" && t.progress === 100);
        if (hasCompleted) {
          onRefreshCodex();
        }
      }
    } catch (err) {
      console.error("Error fetching Suno tasks:", err);
    }
  };

  const handleUpdateConfig = async (updated: Partial<SunoConfig>) => {
    if (!config) return;
    try {
      const res = await fetch("/api/suno/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, ...updated })
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        showStatus("success", `Configuration updated successfully. Mode: ${data.config.simulationMode ? "Simulation (No Suno Required)" : "Live Suno API Integration"}`);
      }
    } catch (err) {
      showStatus("error", "Failed to update configuration.");
    }
  };

  const handleTriggerOracle = async () => {
    setIsOracleTriggering(true);
    showStatus("info", "Prompting the Gemini Oracle to analyze lore and draft a new developmental track...");
    try {
      const res = await fetch("/api/suno/oracle", {
        method: "POST"
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger Oracle");
      }
      
      showStatus("success", `Oracle Cycle successfully initiated: "${data.task.title}" queued!`);
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      showStatus("error", `Oracle cycle error: ${err.message}`);
    } finally {
      setIsOracleTriggering(false);
    }
  };

  const handleTriggerCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customTags.trim() || !customLyrics.trim()) {
      showStatus("error", "Please provide a Title, Style Tags, and Lyrics to queue custom generation.");
      return;
    }
    setIsCustomTriggering(true);
    try {
      const res = await fetch("/api/suno/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle.trim(),
          tags: customTags.trim(),
          lyrics: customLyrics.trim()
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to queue track");
      }
      
      showStatus("success", `Custom track "${customTitle}" successfully added to pipeline!`);
      setCustomTitle("");
      setCustomTags("");
      setCustomLyrics("");
      fetchTasks();
    } catch (err: any) {
      showStatus("error", err.message || "Failed to initiate custom generation.");
    } finally {
      setIsCustomTriggering(false);
    }
  };

  const showStatus = (type: "success" | "error" | "info", text: string) => {
    setStatusMessage({ type, text });
    if (type !== "error") {
      setTimeout(() => {
        setStatusMessage(prev => prev.text === text ? { type: null, text: "" } : prev);
      }, 5000);
    }
  };

  const getStatusColor = (status: SunoTask["status"]) => {
    switch (status) {
      case "queued": return "bg-gray-500 text-white";
      case "generating": return "bg-[#F27D26] text-white animate-pulse";
      case "downloading": return "bg-blue-600 text-white";
      case "completed": return "bg-green-600 text-white";
      case "failed": return "bg-red-600 text-white";
    }
  };

  // Helper to parse if an album contains a permanent audio copy
  const getSecuredAudioUrl = (notes: string) => {
    const match = notes.match(/\[(?:Permanently Secured Local Copy|Secured Audio)\]:\s*(\S+)/i);
    return match ? match[1] : null;
  };

  // Filter albums that are actually generated tracks containing secured audio
  const securedTracks = albums.filter(a => getSecuredAudioUrl(a.notes) !== null);

  return (
    <div className="space-y-6">
      {/* Overview & Core Concept Card */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-[#141414] pb-3 mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#F27D26] animate-pulse" />
              Autodiscography Orchestrator
            </h2>
            <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
              An autonomic closed-loop creative cycle. Securing audio permanently, bypassing expiring CDNs.
            </p>
          </div>

          {/* Quick Config Toggles */}
          {config && (
            <div className="flex items-center gap-3 bg-[#D1CFC9] px-3 py-1.5 border border-[#141414] text-[9px] font-mono uppercase">
              <span className="font-bold">Sandbox Simulation:</span>
              <button
                onClick={() => handleUpdateConfig({ simulationMode: !config.simulationMode })}
                className="flex items-center gap-1 hover:text-[#F27D26] transition-all cursor-pointer"
                title={config.simulationMode ? "Switch to Live Suno Server" : "Switch to Offline Simulator"}
              >
                {config.simulationMode ? (
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Check className="h-3 w-3" /> ACTIVE (SAFE)
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold">DISABLED (LIVE SUNO API)</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Informative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-tight">
          <div className="space-y-2">
            <h3 className="font-mono font-bold uppercase text-[10px] text-[#141414] flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5" />
              1. Bypassing the Async Gap
            </h3>
            <p className="text-stone-700">
              Suno audio generation takes between 30 and 90 seconds. To prevent HTTP connection timeouts or thread blocking, our system starts the task in the background and returns immediately. The React UI polls active states in real-time, displaying precise loading phases.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-mono font-bold uppercase text-[10px] text-[#141414] flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              2. Permanent Ingestion
            </h3>
            <p className="text-stone-700">
              Suno CDN links (cdn1.suno.ai) are temporary and break within hours. When a generation finishes, our Express server immediately downloads the raw MP3 file to local container disk space (<code className="font-mono text-[9px] bg-white px-1">public/audio/</code>), protecting your autodiscography from decay.
            </p>
          </div>
        </div>

        {statusMessage.text && (
          <div className={`mt-4 p-3 flex items-start gap-2 text-[10px] font-mono uppercase border border-[#141414] ${
            statusMessage.type === "success" ? "bg-[#00FF00]/10 text-emerald-800" :
            statusMessage.type === "error" ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800"
          }`}>
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Orchestration Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Commands (Oracle Loop and Custom Queue) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Action 1: Oracle Auton Trigger */}
          <div className="bg-[#D1CFC9] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F27D26]" />
              The Oracle Autonomous Loop
            </h3>
            <p className="text-[11px] text-stone-700 leading-snug mb-4">
              Clicking below engages the <strong>Gemini Oracle</strong> to analyze the active 19-album canon, current soil weather, and active speculation branches. The Oracle will synthesize the next logical or emotional fork in the lore, write authentic lyrics, and automatically kick off the programmatic audio pipeline.
            </p>

            <button
              onClick={handleTriggerOracle}
              disabled={isOracleTriggering}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#141414] uppercase text-xs font-bold font-mono tracking-wider transition-all cursor-pointer bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] disabled:opacity-50"
            >
              {isOracleTriggering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Oracle is Deciding...
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 text-[#F27D26]" />
                  Trigger Autonomous Oracle Cycle
                </>
              )}
            </button>
          </div>

          {/* Action 2: Manual Development Form */}
          <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-3 flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-[#141414]" />
              Queue Specific Verse Track
            </h3>
            <p className="text-[10px] text-stone-600 font-mono uppercase tracking-wider mb-4">
              Manually formulate the metrics for a developmental step to queue in our ingestion worker
            </p>

            <form onSubmit={handleTriggerCustom} className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Track Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Mile Marker 183 Revisited"
                  className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Style Tags (Suno Compatible)</label>
                <input
                  type="text"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  placeholder="e.g. ambient folk drone, open E tuning, modular hum"
                  className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Poetic Verse / Lyrics</label>
                <textarea
                  value={customLyrics}
                  onChange={(e) => setCustomLyrics(e.target.value)}
                  placeholder="Write the stanzas or instructions for vocals..."
                  rows={4}
                  className="w-full text-xs font-serif p-2 border border-[#141414] bg-white focus:outline-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isCustomTriggering}
                className="w-full py-2 border border-[#141414] bg-[#141414] text-[#E4E3E0] uppercase text-xs font-mono font-bold hover:invert tracking-widest cursor-pointer transition-all disabled:opacity-50"
              >
                {isCustomTriggering ? "Queueing..." : "Inject Custom Track into Pipeline"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Pipeline Status & Real-time Tasks */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Live Generation Queue */}
          <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] flex flex-col min-h-[220px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-3 pb-1 border-b border-[#141414] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 animate-spin text-[#F27D26]" />
                Ingestion Queue
              </span>
              <span className="text-[9px] font-mono bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5">
                {tasks.length} ACTIVE
              </span>
            </h3>

            {tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white/50 border border-dashed border-[#141414] rounded-none">
                <Music className="h-8 w-8 text-stone-400 mb-2" />
                <p className="text-[10px] font-mono uppercase text-stone-600">
                  Pipeline is silent.
                </p>
                <p className="text-[9px] font-mono text-stone-500 uppercase mt-0.5">
                  Wake the Oracle or submit a verse to start generation
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white border border-[#141414] p-3 shadow-[2px_2px_0px_0px_#141414]">
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1 mb-2">
                      <h4 className="font-mono font-bold text-[10px] uppercase truncate max-w-[150px]">
                        {task.title}
                      </h4>
                      <span className={`text-[8px] font-mono px-1 py-0.5 uppercase ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-stone-500 uppercase tracking-tight">
                        Tags: {task.tags}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[8px] font-mono uppercase text-stone-500">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 border border-[#141414]">
                          <div 
                            className="bg-[#F27D26] h-full transition-all duration-500" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {task.error && (
                        <p className="text-[8px] font-mono text-red-600 uppercase mt-1">
                          Error: {task.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Suno Live Server Connection Status */}
          <div className="bg-[#D1CFC9] border border-[#141414] p-4 text-[11px]">
            <h3 className="font-mono font-bold uppercase text-[9px] text-stone-700 tracking-wider mb-2">
              PIPELINE NETWORK ROUTER
            </h3>
            {config ? (
              <div className="space-y-1.5 font-mono text-[9px] uppercase">
                <div className="flex justify-between">
                  <span className="text-stone-600">Suno Server URL:</span>
                  <span className="font-bold text-[#141414] truncate max-w-[160px]">{config.sunoApiUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Ingestion Ingress:</span>
                  <span className="text-green-700 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Permanent MP3 Storage:</span>
                  <span className="text-green-700 font-bold">LOCAL CONTAINER</span>
                </div>
                <div className="flex justify-between border-t border-stone-400 pt-1.5 mt-1.5">
                  <span className="text-stone-600">Secured Tracks:</span>
                  <span className="font-bold text-[#141414]">{securedTracks.length} Saved</span>
                </div>
              </div>
            ) : (
              <div className="text-stone-500 font-mono text-[9px] uppercase animate-pulse">
                Fetching router details...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permanently Secured Audio Library Shelf */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-4 pb-2 border-b border-[#141414] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-[#F27D26]" />
            The Secured Permanent Audio Library
          </span>
          <span className="text-[10px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5 uppercase">
            {securedTracks.length} Tracks Locked
          </span>
        </h3>

        {/* Global Active Player HUD */}
        {activePlaybackUrl && (
          <div className="bg-[#D1CFC9] border border-[#141414] p-3.5 mb-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center rounded-full">
                <Volume2 className="h-4 w-4 animate-bounce text-[#F27D26]" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-mono uppercase font-bold text-[#141414] tracking-tight">
                  Now playing secured tape:
                </p>
                <p className="text-[12px] font-serif font-bold text-[#141414] truncate max-w-[250px]">
                  {activePlayingTitle}
                </p>
              </div>
            </div>
            <audio 
              src={activePlaybackUrl} 
              controls 
              autoPlay 
              className="w-full md:w-[350px] h-8 focus:outline-none bg-transparent"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {securedTracks.length === 0 ? (
          <div className="text-center py-10 bg-[#D1CFC9]/40 border border-dashed border-[#141414] rounded-none">
            <Music className="h-10 w-10 text-stone-400 mx-auto mb-2" />
            <p className="text-[11px] font-mono uppercase text-stone-600 font-bold">
              No permanently secured audio registered yet.
            </p>
            <p className="text-[9px] font-mono text-stone-500 uppercase mt-1">
              When the Auton Loop completes a generation, the downloaded MP3 is secured here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securedTracks.map((album) => {
              const url = getSecuredAudioUrl(album.notes);
              const isCurrentlyPlaying = activePlaybackUrl === url;
              
              // Clean up notes to display lyrics in a neat popup/accordion
              const lyricsMatch = album.notes.match(/Lyrics:\s*([\s\S]*?)(?=\n\nStyle:|\n\n\[Permanently|\n\n\[Secured|$)/i);
              const lyricsText = lyricsMatch ? lyricsMatch[1].trim() : "No lyrical notes attached.";

              const styleMatch = album.notes.match(/Style\s*tags?:\s*([^\n]+)/i) || album.notes.match(/Style:\s*([^\n]+)/i);
              const styleText = styleMatch ? styleMatch[1].trim() : "ambient drone";

              return (
                <div 
                  key={album.id}
                  className={`border p-4 flex flex-col justify-between min-h-[160px] bg-white text-[#141414] border-[#141414] shadow-[3px_3px_0px_0px_#141414] transition-all hover:shadow-[4px_4px_0px_0px_#141414] relative ${
                    isCurrentlyPlaying ? "border-2 border-[#F27D26]" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1 mb-2">
                      <span className="font-mono text-[9px] font-bold px-1 py-0.5 border border-[#141414] bg-[#E4E3E0]">
                        Tape {album.id}
                      </span>
                      <span className="text-[8px] font-mono text-stone-500 uppercase">
                        PERMANENT SECURED
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-xs text-[#141414] mb-1 leading-snug">
                      {album.title}
                    </h4>

                    <p className="text-[9px] font-mono text-stone-500 uppercase tracking-tight mb-2 truncate" title={styleText}>
                      Tags: {styleText}
                    </p>

                    <div className="bg-stone-50 p-2 border border-stone-200 max-h-[80px] overflow-y-auto mb-3">
                      <p className="text-[9px] font-serif text-stone-700 whitespace-pre-line leading-normal italic">
                        {lyricsText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => {
                        if (url) {
                          setActivePlaybackUrl(url);
                          setActivePlayingTitle(album.title);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase font-bold border border-[#141414] transition-all cursor-pointer ${
                        isCurrentlyPlaying 
                          ? "bg-[#F27D26] text-[#141414]" 
                          : "bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
                      }`}
                    >
                      <Play className="h-3 w-3" />
                      {isCurrentlyPlaying ? "Playing" : "Listen"}
                    </button>

                    <button
                      onClick={() => onSelectPrompt(`Analyze the lyrics and structure of "${album.title}" which was permanently secured in our autodiscography.`)}
                      className="text-[9px] font-mono uppercase tracking-wider hover:underline font-bold text-stone-700 cursor-pointer"
                    >
                      Discuss &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
