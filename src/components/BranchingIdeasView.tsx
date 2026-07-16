import React, { useState } from "react";
import { BranchingIdea } from "../types";
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Clock, 
  MessageSquare,
  Sparkles,
  BookOpen,
  X
} from "lucide-react";

interface BranchingIdeasViewProps {
  ideas: BranchingIdea[];
  onAddIdea: (idea: Omit<BranchingIdea, "id" | "createdAt">) => void;
  onDeleteIdea: (id: string) => void;
  onSelectPrompt: (promptText: string) => void;
}

export default function BranchingIdeasView({
  ideas,
  onAddIdea,
  onDeleteIdea,
  onSelectPrompt
}: BranchingIdeasViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;
    onAddIdea({
      title: title.trim(),
      notes: notes.trim()
    });
    setTitle("");
    setNotes("");
    setIsAdding(false);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
            <GitFork className="h-4 w-4 text-[#141414] rotate-180" />
            Branching Timelines &amp; Forks
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            Inject new releases, fan theories, or speculative timeline splits
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          id="add-branch-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border border-[#141414] uppercase bg-white hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] transition-all shrink-0 cursor-pointer"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? "Close Drawer" : "Fork Timeline"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-[#D1CFC9] border border-[#141414] p-4 mb-5">
          <h3 className="text-[10px] font-mono uppercase font-bold text-[#141414] mb-3 flex items-center gap-1.5 border-b border-[#141414] pb-1">
            <GitFork className="h-3.5 w-3.5 text-[#141414]" />
            Spawn Speculative Timeline Fork
          </h3>
          <div className="mb-3">
            <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Branch Title / Identifier</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Album 15 Alternative Ending"
              className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">speculative Notes / Fragment Lyrics</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what occurs inside this timeline branch. What themes shift? Who stays at the table?"
              rows={3}
              className="w-full text-xs font-serif p-2 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-black cursor-pointer"
            >
              Inject Into Stream
            </button>
          </div>
        </form>
      )}

      {ideas.length === 0 ? (
        <div className="text-center py-8 bg-[#D1CFC9] border border-[#141414]">
          <GitFork className="h-6 w-6 text-[#141414] mx-auto mb-2" />
          <p className="text-[#141414] text-xs font-mono uppercase tracking-wider">No active branching timelines detected.</p>
          <p className="text-stone-600 text-[10px] font-mono mt-1 uppercase">Click the "Fork Timeline" button above to spawn a branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideas.map((idea) => (
            <div 
              key={idea.id} 
              id={`branch-card-${idea.id}`}
              className="bg-white border border-[#141414] p-4 shadow-[2px_2px_0px_0px_#141414] hover:shadow-[3px_3px_0px_0px_#141414] transition-all duration-150 flex flex-col justify-between rounded-none"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3 border-b border-[#141414]/10 pb-1">
                  <h3 className="font-mono font-bold uppercase text-[11px] text-[#141414] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F27D26] border border-[#141414]"></span>
                    {idea.title}
                  </h3>
                  <button
                    onClick={() => onDeleteIdea(idea.id)}
                    title="Prune branch"
                    className="text-[#141414]/60 hover:text-red-600 p-0.5 rounded cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <p className="text-[11px] font-serif leading-tight text-stone-700 mb-4 whitespace-pre-wrap">
                  {idea.notes}
                </p>
              </div>

              <div className="pt-2 border-t border-[#141414]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[8px] text-stone-500 font-mono uppercase">
                  <Clock className="h-3 w-3 text-stone-500" />
                  {formatDate(idea.createdAt)}
                </div>
                
                <button
                  onClick={() => onSelectPrompt(`How does the branching thread "${idea.title}" interact with our core 19-album chronology? Let's explore its outcomes.`)}
                  className="text-[9px] font-mono uppercase tracking-wider font-bold hover:underline flex items-center gap-1 cursor-pointer text-[#141414]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Weave branch discussion
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
