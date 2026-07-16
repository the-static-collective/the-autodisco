import React, { useState } from "react";
import { Album } from "../types";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Layers, 
  Check, 
  X, 
  FileText,
  Bookmark
} from "lucide-react";

interface ChronologyViewProps {
  albums: Album[];
  onAddAlbum: (album: Omit<Album, "id">) => void;
  onUpdateAlbum: (album: Album) => void;
  onDeleteAlbum: (id: number) => void;
  onSelectPrompt: (promptText: string) => void;
}

export default function ChronologyView({ 
  albums, 
  onAddAlbum, 
  onUpdateAlbum, 
  onDeleteAlbum,
  onSelectPrompt
}: ChronologyViewProps) {
  const [selectedEra, setSelectedEra] = useState<string>("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("Assembly");
  const [notes, setNotes] = useState("");

  const eras = [
    "All",
    "Assembly",
    "Transmissions",
    "Soil",
    "Infrastructure",
    "Liturgical Time",
    "Incarnation",
    "Resolution",
    "Playground",
    "Creep Mode",
    "Daughter's Arc"
  ];

  const eraColors: Record<string, { bg: string; text: string; border: string }> = {
    "Assembly": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Transmissions": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Soil": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Infrastructure": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Liturgical Time": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Incarnation": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Resolution": { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" },
    "Playground": { bg: "bg-[#E4E3E0]", text: "text-[#141414]", border: "border-[#141414]" },
    "Creep Mode": { bg: "bg-[#141414]", text: "text-[#E4E3E0]", border: "border-[#141414]" },
    "Daughter's Arc": { bg: "bg-[#F27D26]", text: "text-[#141414]", border: "border-[#141414] font-bold" },
  };

  const getEraStyle = (eraName?: string) => {
    return eraColors[eraName || "Assembly"] || { bg: "bg-white", text: "text-[#141414]", border: "border-[#141414]" };
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;
    onAddAlbum({
      title: title.trim(),
      era: era,
      notes: notes.trim()
    });
    // Reset Form
    setTitle("");
    setEra("Assembly");
    setNotes("");
    setIsAdding(false);
  };

  const handleStartEdit = (album: Album) => {
    setEditingId(album.id);
    setTitle(album.title);
    setEra(album.era || "Assembly");
    setNotes(album.notes);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null || !title.trim() || !notes.trim()) return;
    onUpdateAlbum({
      id: editingId,
      title: title.trim(),
      era: era,
      notes: notes.trim()
    });
    setEditingId(null);
    setTitle("");
    setEra("Assembly");
    setNotes("");
  };

  const filteredAlbums = selectedEra === "All" 
    ? albums 
    : albums.filter(a => a.era === selectedEra);

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#141414]" />
            The 19-Album Canon (Chronology)
          </h2>
          <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
            Manage the developmental milestones and lyrics of the collective
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
          }}
          id="add-album-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border border-[#141414] uppercase bg-white hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] transition-all shrink-0 cursor-pointer"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? "Cancel Entry" : "Register Album"}
        </button>
      </div>

      {/* Era Filter Pill List */}
      <div className="flex flex-wrap gap-1 mb-5 pb-3 border-b border-[#141414]">
        {eras.map(e => {
          const isSelected = selectedEra === e;
          return (
            <button
              key={e}
              onClick={() => setSelectedEra(e)}
              id={`era-filter-${e.replace(/\s+/g, "-")}`}
              className={`px-2 py-1 text-[9px] font-mono uppercase transition-all cursor-pointer border border-[#141414] ${
                isSelected 
                  ? "bg-[#141414] text-[#E4E3E0]"
                  : "bg-white hover:bg-[#D1CFC9] text-[#141414]"
              }`}
            >
              {e}
            </button>
          );
        })}
      </div>

      {/* Register Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[#D1CFC9] border border-[#141414] p-4 mb-5">
          <h3 className="text-[10px] font-mono uppercase font-bold text-[#141414] mb-3 flex items-center gap-1.5 border-b border-[#141414] pb-1">
            <Calendar className="h-3.5 w-3.5 text-[#141414]" />
            Register New Album Entry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Album Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Album 20 (The Spork Chronicles)"
                className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Core Era Category</label>
              <select
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
              >
                {eras.filter(e => e !== "All").map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Motifs, Lyrics &amp; Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail the guitar tuning, specific events, or narrative fragments..."
              rows={3}
              className="w-full text-xs font-serif p-2 border border-[#141414] bg-white focus:outline-none"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-black cursor-pointer"
            >
              Save to Codex
            </button>
          </div>
        </form>
      )}

      {/* Editing Form Inline Overlay */}
      {editingId !== null && (
        <form onSubmit={handleSaveEdit} className="bg-[#D1CFC9] border border-[#141414] p-4 mb-5">
          <h3 className="text-[10px] font-mono uppercase font-bold text-[#141414] mb-3 flex items-center gap-1.5 border-b border-[#141414] pb-1">
            <Edit className="h-3.5 w-3.5 text-[#141414]" />
            Modify Album #{editingId}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Album Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Core Era Category</label>
              <select
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full text-xs font-mono p-2 border border-[#141414] bg-white focus:outline-none"
              >
                {eras.filter(e => e !== "All").map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[9px] font-mono uppercase font-bold text-[#141414] mb-1">Motifs, Lyrics &amp; Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full text-xs font-serif p-2 border border-[#141414] bg-white focus:outline-none"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer"
            >
              Discard
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-black cursor-pointer"
            >
              Update Album
            </button>
          </div>
        </form>
      )}

      {/* Album List Timeline Display - Styled as Density bento grids */}
      {filteredAlbums.length === 0 ? (
        <div className="text-center py-8 bg-[#D1CFC9] border border-[#141414]">
          <p className="text-[#141414] text-xs font-mono uppercase tracking-wider">No album registered in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredAlbums.map((album) => {
            const isSpecialDark = album.era === "Creep Mode";
            const isOrange = album.era === "Daughter's Arc";
            const style = getEraStyle(album.era);
            return (
              <div 
                key={album.id} 
                className={`border p-3 flex flex-col justify-between min-h-[140px] relative group transition-all duration-150 ${
                  isSpecialDark 
                    ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)]" 
                    : isOrange 
                    ? "bg-[#F27D26] text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414]" 
                    : "bg-white text-[#141414] border-[#141414] shadow-[2px_2px_0px_0px_#141414] hover:shadow-[3px_3px_0px_0px_#141414]"
                }`} 
                id={`album-timeline-item-${album.id}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 border-b border-current pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] font-bold px-1 py-0.5 border border-current`}>
                        {album.id < 10 ? `0${album.id}` : album.id}
                      </span>
                      <h3 className="font-mono font-bold uppercase text-[10px] tracking-tight truncate max-w-[120px]">
                        {album.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(album)}
                          title="Edit album details"
                          className="p-0.5 hover:bg-current/10 rounded cursor-pointer"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteAlbum(album.id)}
                          title="Remove album"
                          className="p-0.5 hover:bg-red-500/10 rounded cursor-pointer text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] font-serif leading-tight opacity-90 break-words line-clamp-3">
                    {album.notes}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-current/20 flex items-center justify-between gap-1">
                  <span className="text-[8px] font-mono uppercase opacity-70 tracking-wide">
                    {album.era || "Assembly"}
                  </span>
                  <button
                    onClick={() => onSelectPrompt(`Tell me more about the musical and narrative choices of Album ${album.id} "${album.title}".`)}
                    className="text-[9px] font-mono uppercase tracking-wider font-bold hover:underline flex items-center gap-0.5 cursor-pointer text-current"
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
  );
}
