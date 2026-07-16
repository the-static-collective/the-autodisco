import React, { useState, useRef } from "react";
import { Codex } from "../types";
import { Download, Upload, RefreshCw, FileCode, Check, AlertCircle } from "lucide-react";

interface CodexJSONManagerProps {
  codex: Codex;
  onImportCodex: (imported: Codex) => void;
  onResetToDefault: () => void;
}

export default function CodexJSONManager({
  codex,
  onImportCodex,
  onResetToDefault
}: CodexJSONManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codex, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `static_collective_codex_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatus({
        type: "success",
        message: "Codex downloaded successfully!"
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Export failed: ${err.message}`
      });
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setStatus({
        type: "error",
        message: "Only JSON files are supported."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text);

        // Basic structural validation
        if (typeof importedData !== "object" || !importedData) {
          throw new Error("Invalid format");
        }
        if (!importedData.system_instructions || !Array.isArray(importedData.albums)) {
          throw new Error("Missing required fields (system_instructions or albums array)");
        }

        onImportCodex({
          system_instructions: String(importedData.system_instructions),
          albums: Array.isArray(importedData.albums) ? importedData.albums : [],
          branching_ideas: Array.isArray(importedData.branching_ideas) ? importedData.branching_ideas : []
        });

        setStatus({
          type: "success",
          message: "Codex successfully imported into local session!"
        });
        setTimeout(() => setStatus({ type: null, message: "" }), 4000);
      } catch (err: any) {
        setStatus({
          type: "error",
          message: `Import failed: ${err.message}. Please verify the JSON schema.`
        });
      }
    };
    reader.onerror = () => {
      setStatus({
        type: "error",
        message: "Error reading the uploaded file."
      });
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414] pb-1.5 flex items-center gap-2">
          <FileCode className="h-4 w-4 text-[#141414]" />
          Backup &amp; Restore Codex JSON
        </h2>
        <p className="text-[10px] text-stone-600 font-mono mt-1 uppercase tracking-wider">
          Export your current configured canon or restore a previously saved JSON codex
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="codex-json-dropzone"
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] rounded-none ${
          isDragging 
            ? "border-[#F27D26] bg-white" 
            : "border-[#141414] bg-white hover:bg-[#D1CFC9]"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
        <Upload className="h-6 w-6 text-[#141414] mb-2" />
        <p className="text-[11px] font-mono uppercase font-bold text-[#141414]">
          Drag and drop your codex JSON here, or <span className="text-[#F27D26] hover:underline cursor-pointer">browse files</span>
        </p>
        <p className="text-[9px] text-stone-500 font-mono mt-1 uppercase">
          Supported file: .json (with albums &amp; system instructions)
        </p>
      </div>

      {status.type && (
        <div className={`mt-4 p-3 flex items-start gap-2 text-[10px] font-mono uppercase border border-[#141414] rounded-none ${
          status.type === "success" 
            ? "bg-[#00FF00]/10 text-emerald-800" 
            : "bg-red-50 text-red-800"
        }`}>
          {status.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Control Actions */}
      <div className="mt-5 pt-4 border-t border-[#141414] flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleExport}
          id="export-codex-btn"
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase border border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] transition-all cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Export Codex JSON
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to revert all changes? This will clear all custom albums and branch entries back to the baseline 19-album canon.")) {
              onResetToDefault();
              setStatus({
                type: "success",
                message: "Restored baseline canon default configuration successfully."
              });
              setTimeout(() => setStatus({ type: null, message: "" }), 3000);
            }
          }}
          id="reset-codex-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase border border-red-700 bg-white text-red-700 hover:bg-red-700 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Baseline Canon
        </button>
      </div>
    </div>
  );
}
