import React from "react";
import { Motif } from "../types";
import { STATIC_COLLECTIVE_MOTIFS } from "../data";
import { 
  Guitar, 
  Citrus, 
  Apple, 
  LayoutGrid, 
  Sparkles, 
  Flame,
  HelpCircle
} from "lucide-react";

// Helper to render appropriate icon
const MotifIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case "Guitar":
      return <Guitar className={className} />;
    case "Citrus":
      return <Citrus className={className} />;
    case "Apple":
      return <Apple className={className} />;
    case "LayoutGrid":
      return <LayoutGrid className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Flame":
      return <Flame className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

interface MotifsGridProps {
  onSelectMotif: (motif: Motif) => void;
  selectedMotifId?: string;
}

export default function MotifsGrid({ onSelectMotif, selectedMotifId }: MotifsGridProps) {
  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5">
          Recurring Motifs
        </h2>
        <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
          Core recurrence structures &amp; recurring codes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STATIC_COLLECTIVE_MOTIFS.map((motif) => {
          const isSelected = selectedMotifId === motif.id;
          return (
            <button
              key={motif.id}
              onClick={() => onSelectMotif(motif)}
              id={`motif-btn-${motif.id}`}
              className={`text-left p-3.5 border transition-all duration-150 cursor-pointer flex gap-3 group relative ${
                isSelected
                  ? "bg-[#F27D26] text-[#141414] border-2 border-[#141414] font-medium"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
              }`}
            >
              <div className={`p-1.5 shrink-0 flex items-center justify-center border border-[#141414] h-8 w-8 ${
                isSelected ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414] group-hover:bg-[#F27D26]"
              }`}>
                <MotifIcon name={motif.iconName} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-mono font-bold uppercase tracking-tight text-[11px] flex items-center gap-1.5">
                  {motif.name}
                  {motif.code && (
                    <span className="font-mono text-[9px] bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 border border-[#141414]">
                      {motif.code}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] font-serif leading-tight opacity-90 mt-1 line-clamp-2">
                  {motif.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
