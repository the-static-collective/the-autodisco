import React, { useState } from "react";
import { Sparkles, Save, Undo, HelpCircle, FileText } from "lucide-react";

interface SystemInstructionPaneProps {
  instructions: string;
  onSaveInstructions: (instructions: string) => void;
  onResetInstructions: () => void;
}

export default function SystemInstructionPane({
  instructions,
  onSaveInstructions,
  onResetInstructions
}: SystemInstructionPaneProps) {
  const [editedText, setEditedText] = useState(instructions);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveInstructions(editedText);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#141414]" />
          System Instructions / Codex Guidelines
        </h2>
        <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
          Modify the foundational rules that dictate the AI's persona, vocabulary, and tones
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={10}
            className="w-full text-xs font-mono p-3 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#F27D26] leading-relaxed text-[#141414] rounded-none"
            placeholder="Define the system instructions for the conversational witness here..."
          ></textarea>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-[9px] text-stone-600 font-mono uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-[#F27D26] shrink-0" />
            <span>Rules are compiled dynamically before being dispatched to Gemini</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to discard your edits and revert back to baseline instructions?")) {
                  onResetInstructions();
                  setEditedText(instructions);
                }
              }}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer"
            >
              Revert to Baseline
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono uppercase border border-[#141414] cursor-pointer transition-all ${
                isSaved 
                  ? "bg-[#F27D26] text-[#141414] font-bold" 
                  : "bg-[#141414] text-[#E4E3E0] hover:bg-black"
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaved ? "Saved Instructions!" : "Apply Rules"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
