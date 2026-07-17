import React, { useState, useEffect, useRef } from "react";
import { ownerFetch } from "../lib/supabaseClient";
import { 
  Music, 
  Play, 
  Square, 
  Sparkles, 
  Save, 
  BookOpen, 
  Check, 
  AlertTriangle, 
  Info, 
  ChevronRight,
  Database,
  History,
  Volume2
} from "lucide-react";
import { SynthEngine, Composition, NoteEvent, ChordEvent } from "./SynthEngine";

// Notes in one octave helper
const OCTAVE_KEYS = [
  { note: "C", isBlack: false },
  { note: "C#", isBlack: true },
  { note: "D", isBlack: false },
  { note: "D#", isBlack: true },
  { note: "E", isBlack: false },
  { note: "F", isBlack: false },
  { note: "F#", isBlack: true },
  { note: "G", isBlack: false },
  { note: "G#", isBlack: true },
  { note: "A", isBlack: false },
  { note: "A#", isBlack: true },
  { note: "B", isBlack: false }
];

// Generate keys from C3 (48) to B5 (83) - 36 keys
const KEYBOARD_NOTES: { midi: number; name: string; isBlack: boolean }[] = [];
for (let m = 83; m >= 48; m--) {
  const octave = Math.floor(m / 12) - 1;
  const noteIndex = m % 12;
  const keyInfo = OCTAVE_KEYS[noteIndex];
  KEYBOARD_NOTES.push({
    midi: m,
    name: `${keyInfo.note}${octave}`,
    isBlack: keyInfo.isBlack
  });
}

export default function PolyphonicPorch() {
  const [activeSubTab, setActiveSubTab] = useState<"sequencer" | "codex" | "sessions">("sequencer");
  
  // Codex states
  const [codex, setCodex] = useState<any>({ scales: [], chords: [], intervals: [] });
  const [activeCodexTab, setActiveCodexTab] = useState<"scales" | "chords" | "intervals">("scales");
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [editingPoeticText, setEditingPoeticText] = useState("");

  // Sessions list
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // Generator inputs
  const [generationPrompt, setGenerationPrompt] = useState("a morning light on a wooden table, peaches smelling sweet");
  const [selectedKey, setSelectedKey] = useState("E");
  const [selectedScale, setSelectedScale] = useState("dorian");
  const [tempo, setTempo] = useState(84);

  // Current active composition in Piano Roll
  const [currentComposition, setCurrentComposition] = useState<Composition>({
    key: "E",
    scale: "dorian",
    bpm: 84,
    chords: [
      { notes: [52, 59, 64, 67], time: 0, duration: 4 },
      { notes: [52, 57, 61, 66], time: 4, duration: 4 },
      { notes: [52, 59, 64, 67], time: 8, duration: 4 },
      { notes: [52, 57, 61, 66], time: 12, duration: 4 }
    ],
    melody: [
      { midi: 64, time: 0, duration: 1 },
      { midi: 66, time: 1, duration: 1 },
      { midi: 67, time: 2, duration: 2 },
      { midi: 69, time: 4, duration: 1 },
      { midi: 67, time: 5, duration: 1 },
      { midi: 66, time: 6, duration: 2 },
      { midi: 64, time: 8, duration: 1 },
      { midi: 66, time: 9, duration: 1 },
      { midi: 67, time: 10, duration: 2 },
      { midi: 71, time: 12, duration: 2 },
      { midi: 69, time: 14, duration: 2 }
    ]
  });

  // T5 Cognitive pipeline states
  const [isGenerating, setIsGenerating] = useState(false);
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([]);
  const [critiques, setCritiques] = useState<any[]>([]);
  const [seedComposition, setSeedComposition] = useState<Composition | null>(null);

  // Piano Roll active view state
  const [pianoRollTab, setPianoRollTab] = useState<"melody" | "chords">("melody");
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);

  // Synth Engine instance
  const synthEngineRef = useRef<SynthEngine | null>(null);

  useEffect(() => {
    synthEngineRef.current = new SynthEngine();
    loadCodexAndSessions();

    return () => {
      if (synthEngineRef.current) {
        synthEngineRef.current.stopAll();
      }
    };
  }, []);

  const loadCodexAndSessions = async () => {
    try {
      const theoryRes = await ownerFetch("/api/music-theory");
      if (theoryRes.ok) {
        const theoryData = await theoryRes.json();
        setCodex(theoryData);
      }

      const sessionsRes = await ownerFetch("/api/music-sessions");
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }
    } catch (e) {
      console.error("Failed to load music theory or sessions:", e);
    }
  };

  // Trigger T5 Concentric Generation
  const handleGenerateComposition = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setReasoningLogs(["[INITIALIZING] Establishing line to the Concentric Music Oracle..."]);
    setCritiques([]);
    setSeedComposition(null);

    try {
      const response = await ownerFetch("/api/generate-theory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: generationPrompt,
          keyCenter: selectedKey,
          scaleType: selectedScale,
          bpm: tempo
        })
      });

      const data = await response.json();
      if (data.reasoningLogs) {
        setReasoningLogs(data.reasoningLogs);
      }

      if (response.ok && data.success) {
        setSeedComposition(data.seedDraft);
        setCritiques(data.critiques || []);
        setCurrentComposition(data.finalComposition);
        // Instant play
        if (synthEngineRef.current) {
          synthEngineRef.current.playComposition(data.finalComposition, (beat) => {
            setActiveBeat(beat);
          });
          setPlaying(true);
        }
      } else {
        setReasoningLogs(prev => [...prev, `[PIPELINE FAILURE] ${data.error || "Execution broken."}`]);
      }
    } catch (err: any) {
      setReasoningLogs(prev => [...prev, `[PIPELINE ERROR] Connection interrupted: ${err.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayToggle = () => {
    if (!synthEngineRef.current) return;

    if (playing) {
      synthEngineRef.current.stopAll();
      setPlaying(false);
      setActiveBeat(-1);
    } else {
      synthEngineRef.current.playComposition(currentComposition, (beat) => {
        setActiveBeat(beat);
      });
      setPlaying(true);
    }
  };

  // Save active composition as a permanent session
  const handleSaveSession = async () => {
    const title = prompt("Enter a poetic name for this movement:", `The ${currentComposition.key} ${currentComposition.scale} movement`);
    if (!title) return;

    try {
      const res = await ownerFetch("/api/music-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          key: currentComposition.key,
          scale: currentComposition.scale,
          bpm: currentComposition.bpm,
          description: currentComposition.description || "Synthesized resolution.",
          composition: currentComposition
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        alert("Movement saved permanently to local databases.");
      }
    } catch (e) {
      alert("Failed to save session.");
    }
  };

  // Edit and save codex poetic definitions
  const handleStartEditing = (concept: any) => {
    setEditingConceptId(concept.id);
    setEditingPoeticText(concept.poetic_definition);
  };

  const handleSaveConceptDefinition = async (type: "scales" | "chords" | "intervals", conceptId: string) => {
    const updatedConcepts = { ...codex };
    const list = updatedConcepts[type];
    const index = list.findIndex((c: any) => c.id === conceptId);
    if (index !== -1) {
      list[index].poetic_definition = editingPoeticText;
    }

    try {
      const res = await ownerFetch("/api/music-theory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConcepts)
      });

      if (res.ok) {
        setCodex(updatedConcepts);
        setEditingConceptId(null);
      } else {
        alert("Failed to update concept on server.");
      }
    } catch (err) {
      alert("Error updating concept.");
    }
  };

  const handleLoadSessionIntoRoll = (sess: any) => {
    setCurrentComposition(sess.composition);
    setSelectedSession(sess);
    setActiveSubTab("sequencer");
    if (playing && synthEngineRef.current) {
      synthEngineRef.current.stopAll();
      setPlaying(false);
      setActiveBeat(-1);
    }
  };

  // Helpers to check if piano roll note is active
  const isNoteAtBeat = (midi: number, beat: number) => {
    if (pianoRollTab === "melody") {
      return currentComposition.melody.some(n => n.midi === midi && n.time === beat);
    } else {
      // Chords can span multiple beats, check start time and duration
      return currentComposition.chords.some(c => 
        c.notes.includes(midi) && 
        beat >= c.time && 
        beat < (c.time + c.duration)
      );
    }
  };

  const handleCellClick = (midi: number, beat: number) => {
    // Left-click plays note immediately
    if (synthEngineRef.current) {
      synthEngineRef.current.playNoteImmediate(midi, pianoRollTab === "melody" ? "sine" : "triangle");
    }

    // Toggle note in currentComposition (allowing customized sequencing)
    if (pianoRollTab === "melody") {
      const index = currentComposition.melody.findIndex(n => n.midi === midi && n.time === beat);
      let updatedMelody = [...currentComposition.melody];
      if (index !== -1) {
        updatedMelody.splice(index, 1);
      } else {
        updatedMelody.push({ midi, time: beat, duration: 1 });
      }
      setCurrentComposition({
        ...currentComposition,
        melody: updatedMelody
      });
    } else {
      // Find chord at beat block (0, 4, 8, 12)
      const chordBlock = Math.floor(beat / 4) * 4;
      const updatedChords = currentComposition.chords.map(c => {
        if (c.time === chordBlock) {
          const hasNote = c.notes.includes(midi);
          return {
            ...c,
            notes: hasNote ? c.notes.filter(n => n !== midi) : [...c.notes, midi]
          };
        }
        return c;
      });
      setCurrentComposition({
        ...currentComposition,
        chords: updatedChords
      });
    }
  };

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] rounded-none">
      
      {/* Tab bar header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-3 mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-2">
            <Music className="h-4 w-4 text-[#F27D26]" />
            The Polyphonic Hearth &amp; Music Theory Lab
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            Aesthetic Synthesis Room, 3-Layer T5 pipeline, &amp; interactive soundscapes
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex gap-1.5 font-mono text-[9px] uppercase">
          <button
            onClick={() => setActiveSubTab("sequencer")}
            className={`px-3 py-1.5 border border-[#141414] transition-all cursor-pointer ${
              activeSubTab === "sequencer" ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-stone-100"
            }`}
          >
            Sequencer &amp; Generator
          </button>
          <button
            onClick={() => setActiveSubTab("codex")}
            className={`px-3 py-1.5 border border-[#141414] transition-all cursor-pointer ${
              activeSubTab === "codex" ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-stone-100"
            }`}
          >
            <BookOpen className="inline-block h-3 w-3 mr-1 align-text-top" />
            Lyrical Codex
          </button>
          <button
            onClick={() => setActiveSubTab("sessions")}
            className={`px-3 py-1.5 border border-[#141414] transition-all cursor-pointer ${
              activeSubTab === "sessions" ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-stone-100"
            }`}
          >
            <History className="inline-block h-3 w-3 mr-1 align-text-top" />
            Saved Movements ({sessions.length})
          </button>
        </div>
      </div>

      {activeSubTab === "sequencer" && (
        <div className="space-y-6">
          
          {/* GENERATOR INPUT LAB */}
          <div className="bg-stone-100 border border-[#141414] p-4 rounded-none shadow-[1px_1px_0px_0px_#141414]">
            <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider block mb-2 font-bold">
              ✦ T5 Recurrent Composition Parameters ✦
            </span>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              <div className="md:col-span-6 flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase text-stone-600">Poetic Vibe / Prompt</label>
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="Enter a description to ground the composition's tone..."
                  className="bg-white border border-[#141414] text-xs font-serif p-2 resize-none h-14 text-[#141414] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase text-stone-600">Key Center</label>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="bg-white border border-[#141414] text-xs font-mono p-2 h-14 text-[#141414] focus:outline-none"
                >
                  {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase text-stone-600">Scale / Mode</label>
                <select
                  value={selectedScale}
                  onChange={(e) => setSelectedScale(e.target.value)}
                  className="bg-white border border-[#141414] text-xs font-mono p-2 h-14 text-[#141414] focus:outline-none"
                >
                  <option value="major">Major (Ionian)</option>
                  <option value="minor">Natural Minor</option>
                  <option value="dorian">Dorian Mode</option>
                  <option value="phrygian">Phrygian Mode</option>
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase text-stone-600">Tempo (BPM)</label>
                <input
                  type="number"
                  value={tempo}
                  onChange={(e) => setTempo(Math.max(40, Math.min(220, parseInt(e.target.value) || 84)))}
                  className="bg-white border border-[#141414] text-xs font-mono p-2 h-14 text-center text-[#141414] focus:outline-none"
                />
              </div>

              <div className="md:col-span-12 flex justify-end gap-2 border-t border-stone-200 pt-3">
                <button
                  onClick={handleGenerateComposition}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase font-bold tracking-wider hover:invert flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGenerating ? "Synthesizing Canon..." : "Invoke 3-Layer T5 Generator"}
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE PLAYBACK CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#141414] p-3 shadow-[1px_1px_0px_0px_#141414]">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayToggle}
                className={`w-9 h-9 rounded-full border border-[#141414] flex items-center justify-center cursor-pointer transition-all ${
                  playing ? "bg-[#be6447] text-white animate-pulse" : "bg-[#64abbe] text-white hover:scale-105"
                }`}
              >
                {playing ? <Square className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </button>
              <div>
                <span className="text-[7px] font-mono uppercase text-stone-400 block">CURRENT PLAYING SETTINGS</span>
                <span className="text-xs font-bold uppercase text-[#141414] flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-[#F27D26]" />
                  {currentComposition.key} {currentComposition.scale} — {currentComposition.bpm} BPM
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSession}
                className="px-3 py-1.5 bg-white border border-[#141414] font-mono text-[9px] uppercase hover:bg-stone-50 flex items-center gap-1.5"
              >
                <Save className="h-3 w-3" />
                Commit Movement
              </button>
            </div>
          </div>

          {/* THE PIANO ROLL AND LOGS COLUMN */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* PIANO ROLL GRID */}
            <div className="xl:col-span-8 flex flex-col border border-[#141414] bg-stone-900 overflow-hidden">
              <div className="bg-[#141414] px-4 py-2 border-b border-[#141414] flex items-center justify-between text-[#E4E3E0]">
                <div className="flex gap-1">
                  <button
                    onClick={() => setPianoRollTab("melody")}
                    className={`px-3 py-1 font-mono text-[9px] uppercase border transition-all ${
                      pianoRollTab === "melody" ? "bg-[#64abbe] text-white border-[#64abbe]" : "bg-stone-800 text-stone-400 border-stone-700 hover:text-white"
                    }`}
                  >
                    Soprano Melody Line
                  </button>
                  <button
                    onClick={() => setPianoRollTab("chords")}
                    className={`px-3 py-1 font-mono text-[9px] uppercase border transition-all ${
                      pianoRollTab === "chords" ? "bg-[#be6447] text-white border-[#be6447]" : "bg-stone-800 text-stone-400 border-stone-700 hover:text-white"
                    }`}
                  >
                    Harmonic Block Chords
                  </button>
                </div>
                <div className="text-[8px] font-mono text-stone-400 uppercase tracking-wider">
                  Playhead Tracker: beat {activeBeat !== -1 ? activeBeat + 1 : "Idle"}
                </div>
              </div>

              {/* Piano Keyboard + Beat Matrix Grid Wrapper */}
              <div className="flex flex-1 max-h-[380px] overflow-y-auto relative scrollbar-thin">
                
                {/* Fixed Piano keys */}
                <div className="w-14 sticky left-0 z-10 bg-stone-950 border-r border-stone-800 flex flex-col">
                  {KEYBOARD_NOTES.map((note) => (
                    <div
                      key={`key-${note.midi}`}
                      onClick={() => synthEngineRef.current?.playNoteImmediate(note.midi, "triangle")}
                      className={`h-[18px] border-b border-stone-800/80 px-1 flex items-center justify-end text-[7px] font-mono uppercase cursor-pointer select-none transition-all ${
                        note.isBlack 
                          ? "bg-stone-900 text-stone-400 hover:bg-stone-800" 
                          : "bg-stone-100 text-stone-800 hover:bg-stone-200"
                      }`}
                    >
                      {note.name}
                    </div>
                  ))}
                </div>

                {/* Interactive Grid blocks */}
                <div 
                  className="flex-1 relative overflow-x-auto min-w-[320px]"
                  style={{ display: "grid", gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
                >
                  
                  {/* Vertical Playhead highlighter */}
                  {activeBeat !== -1 && (
                    <div 
                      className="absolute top-0 bottom-0 w-[6.25%] bg-amber-500/10 border-l border-r border-amber-400/50 pointer-events-none z-20"
                      style={{ left: `${(activeBeat / 16) * 100}%` }}
                    />
                  )}

                  {/* Beats loop columns */}
                  {Array.from({ length: 16 }).map((_, colIdx) => (
                    <div key={`col-${colIdx}`} className="flex flex-col border-r border-stone-800/40 w-full relative">
                      {/* Beat index header background highlight */}
                      <div className={`h-3 border-b border-stone-800 text-center text-[6px] font-mono uppercase select-none ${colIdx % 4 === 0 ? "bg-stone-800/80 text-white font-bold" : "bg-stone-900 text-stone-500"}`}>
                        {colIdx + 1}
                      </div>

                      {KEYBOARD_NOTES.map((note) => {
                        const active = isNoteAtBeat(note.midi, colIdx);
                        return (
                          <div
                            key={`cell-${note.midi}-${colIdx}`}
                            onClick={() => handleCellClick(note.midi, colIdx)}
                            className={`h-[18px] border-b border-stone-800/20 cursor-pointer transition-all duration-100 flex items-center justify-center ${
                              active
                                ? pianoRollTab === "melody" 
                                  ? "bg-[#64abbe] shadow-[0_0_4px_#64abbe] border-sky-400/30" 
                                  : "bg-[#be6447] shadow-[0_0_4px_#be6447] border-red-400/30"
                                : colIdx % 4 === 0 
                                  ? "bg-stone-800/20 hover:bg-stone-700/35" 
                                  : "bg-transparent hover:bg-stone-800/30"
                            }`}
                          >
                            {active && pianoRollTab === "melody" && <Sparkles className="h-2 w-2 text-white/90" />}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

              </div>
              <div className="bg-[#141414] p-3 text-[10px] font-mono text-stone-400 border-t border-stone-800 uppercase flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>✦ Left-click notes on the roll grid to customize sequence.</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#64abbe]" /> Melody</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#be6447]" /> Chords</div>
                </div>
              </div>
            </div>

            {/* REASONING STREAM & CRITIQUES */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              
              {/* COMPOSITION LYRICS / DESCRIPTION */}
              {currentComposition.description && (
                <div className="bg-white border border-[#141414] p-4 shadow-[1px_1px_0px_0px_#141414] flex flex-col">
                  <span className="text-[7px] font-mono text-stone-400 uppercase tracking-widest block font-bold mb-1">
                    ACTIVE COMPOSITION LORE
                  </span>
                  <p className="font-serif italic text-xs leading-relaxed text-stone-800">
                    &ldquo;{currentComposition.description}&rdquo;
                  </p>
                </div>
              )}

              {/* T5 COGNITIVE STREAM */}
              <div className="bg-stone-900 text-[#E4E3E0] border border-[#141414] p-4 flex flex-col flex-1 h-[260px] overflow-y-auto scrollbar-thin">
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block font-bold border-b border-stone-800 pb-1 mb-2">
                  T5 Cognitive Reasoning Stream
                </span>
                <div className="space-y-1.5 font-mono text-[9px] leading-tight text-stone-300">
                  {reasoningLogs.length === 0 ? (
                    <span className="text-stone-500 italic block">Oracle idle. Waiting to generate...</span>
                  ) : (
                    reasoningLogs.map((log, index) => {
                      let color = "text-stone-300";
                      if (log.startsWith("[INITIALIZING]")) color = "text-sky-400";
                      else if (log.startsWith("[PARAMETERS]")) color = "text-stone-400";
                      else if (log.startsWith("[LAYER 1")) color = "text-amber-300 font-bold";
                      else if (log.startsWith("[LAYER 2")) color = "text-purple-300 font-bold";
                      else if (log.startsWith("[LAYER 3")) color = "text-emerald-300 font-bold";
                      else if (log.startsWith("[CRITIQUE")) {
                        if (log.includes("WARNING")) color = "text-yellow-400";
                        else if (log.includes("SUCCESS")) color = "text-emerald-400";
                        else color = "text-stone-400";
                      }
                      else if (log.includes("WARNING")) color = "text-orange-400";
                      else if (log.startsWith("[PIPELINE COMPLETE]")) color = "text-emerald-400 font-extrabold";
                      return (
                        <div key={index} className={`${color} break-words whitespace-pre-wrap leading-snug border-b border-stone-800/10 pb-1`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {activeSubTab === "codex" && (
        <div className="space-y-4">
          <div className="bg-[#D1CFC9] p-1 border border-[#141414] flex gap-1">
            {["scales", "chords", "intervals"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveCodexTab(tab as any);
                  setEditingConceptId(null);
                }}
                className={`px-3 py-1.5 font-mono text-[9px] uppercase border cursor-pointer transition-all ${
                  activeCodexTab === tab ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-stone-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {codex[activeCodexTab]?.map((concept: any) => {
              const isEditing = editingConceptId === concept.id;
              return (
                <div 
                  key={concept.id}
                  className="bg-white border border-[#141414] p-4 shadow-[1px_1px_0px_0px_#141414] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start border-b border-stone-200 pb-1.5 mb-2.5">
                      <div>
                        <h4 className="font-mono font-bold text-xs text-[#141414]">
                          {concept.name}
                        </h4>
                        <span className="text-[8px] font-mono text-stone-500 uppercase">
                          {concept.formula || `Ratio: ${concept.ratio} | Semitones: ${concept.semitones}`}
                        </span>
                      </div>
                      <span className="text-[7px] font-mono px-1.5 py-0.5 border border-stone-300 uppercase bg-stone-50 text-stone-600">
                        {concept.id}
                      </span>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={editingPoeticText}
                        onChange={(e) => setEditingPoeticText(e.target.value)}
                        className="w-full text-xs font-serif italic border border-[#141414] p-2 bg-stone-50 h-20 text-[#141414] focus:outline-none"
                      />
                    ) : (
                      <p className="font-serif italic text-xs leading-relaxed text-stone-800">
                        &ldquo;{concept.poetic_definition}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end mt-4 pt-2.5 border-t border-stone-100">
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingConceptId(null)}
                          className="px-2.5 py-1 text-[8px] font-mono uppercase bg-stone-200 hover:bg-stone-300 text-stone-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveConceptDefinition(activeCodexTab, concept.id)}
                          className="px-2.5 py-1 text-[8px] font-mono uppercase bg-[#141414] text-[#E4E3E0] hover:invert"
                        >
                          Commit Lore
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditing(concept)}
                        className="px-2.5 py-1 text-[8px] font-mono uppercase bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700"
                      >
                        Refine Metaphor
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === "sessions" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#141414] p-4">
            <h3 className="font-mono font-bold text-xs uppercase text-[#141414] mb-1">
              Speculative Session Archive
            </h3>
            <p className="text-[10px] text-stone-500 font-mono uppercase">
              Permanent local records of T5 cognitive compositions saved to disk
            </p>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center p-8 bg-white border border-stone-200 font-mono text-xs text-stone-400">
                No saved movements discovered yet.
              </div>
            ) : (
              sessions.map((sess: any) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <div 
                    key={sess.id}
                    className={`bg-white border border-[#141414] p-4 shadow-[1px_1px_0px_0px_#141414] flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${
                      isSelected ? "border-l-4 border-l-[#be6447]" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono font-bold text-xs uppercase text-[#141414]">
                          {sess.title}
                        </h4>
                        <span className="text-[8px] font-mono bg-stone-100 px-1.5 py-0.5 border border-stone-200 uppercase">
                          {sess.key} {sess.scale}
                        </span>
                      </div>
                      <p className="text-[8px] font-mono text-stone-400 uppercase mt-0.5">
                        Timestamp: {new Date(sess.timestamp).toLocaleString()} | BPM: {sess.bpm}
                      </p>
                      <p className="font-serif italic text-xs leading-relaxed text-stone-800 mt-2">
                        &ldquo;{sess.description}&rdquo;
                      </p>
                    </div>

                    <button
                      onClick={() => handleLoadSessionIntoRoll(sess)}
                      className="px-3 py-1.5 bg-[#141414] text-[#E4E3E0] font-mono text-[9px] uppercase hover:invert flex items-center gap-1 self-start md:self-auto"
                    >
                      Load into Roll
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
