import React, { useEffect, useState } from "react";
import { ownerFetch } from "../lib/supabaseClient";
import { motion } from "motion/react";
import { 
  GitCommit, 
  HelpCircle, 
  Copy, 
  Check, 
  AlertTriangle, 
  Loader2, 
  X, 
  RefreshCw, 
  Link, 
  ShieldAlert, 
  Database,
  ArrowDown,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Award
} from "lucide-react";

export interface LineageEvent {
  id: string;
  status: "resolved" | "missing" | "loop_detected" | "depth_limit";
  ledgerUri: string;
  type: string | null;
  createdAt: string | null;
  mode: string | null;
  hop: number | null;
  originNode: string | null;
  nodeName: string | null;
  traceId: string | null;
  parentEventId: string | null;
  summary: string;
}

interface LineageBraidProps {
  eventId: string;
  onClose?: () => void;
}

export const LineageBraid: React.FC<LineageBraidProps> = ({ eventId, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState<LineageEvent[]>([]);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);

  const fetchLineage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ownerFetch(`/api/hive/lineage/${eventId}?maxDepth=8`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch lineage braid from ledger.");
      }
      const data = await response.json();
      setChain(data.chain || []);
    } catch (err: any) {
      console.error("Error fetching lineage:", err);
      setError(err.message || "An error occurred while contacting the federated ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchLineage();
    }
  }, [eventId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [key]: false }));
    }, 1500);
  };

  return (
    <div className="bg-[#1C1A17] text-[#FAF8F5] p-6 border-2 border-[#abbe64]/30 shadow-[4px_4px_0px_0px_#141414] font-sans max-w-2xl w-full mx-auto" id="lineage-braid-panel">
      
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#abbe64]/20 pb-4 mb-6">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#abbe64] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#abbe64] animate-pulse" />
            The Lineage Braid
          </h3>
          <p className="text-xs font-serif italic text-stone-400 mt-1">
            Tracing release, receipt, and accepted mutation without repairing missing history.
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white border border-stone-800 hover:border-stone-600 p-1 bg-stone-900 transition-all cursor-pointer rounded-none"
            aria-label="Close Lineage Braid"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 font-mono text-xs text-stone-400">
          <Loader2 className="h-6 w-6 text-[#64abbe] animate-spin" />
          <span className="animate-pulse uppercase tracking-widest">Sifting through witness ledgers...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-950/20 border border-red-900/40 p-5 rounded-none space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-mono text-xs uppercase font-bold">
            <ShieldAlert className="h-5 w-5" />
            Traversal Interrupted
          </div>
          <p className="text-xs font-serif text-stone-300 leading-relaxed">
            {error}
          </p>
          <button 
            onClick={fetchLineage}
            className="px-4 py-1.5 bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-300 font-mono text-[10px] uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Retry Traversal
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && chain.length === 0 && (
        <div className="text-center py-12 border border-stone-800 bg-stone-900/30 p-6 font-mono text-xs uppercase text-stone-500">
          No ledger ancestry records discovered.
        </div>
      )}

      {/* Traversed Chain */}
      {!loading && !error && chain.length > 0 && (
        <div className="space-y-0 relative">
          
          {chain.map((event, idx) => {
            const isLast = idx === chain.length - 1;
            const isAcceptedMutation = event.type === "AUTODISCO_MUTATION_ACCEPTED";
            
            // Border & Glow Aura Logic
            let themeColor = "#64abbe"; // resolved ancestry default
            let badgeText = "RESOLVED WITNESS";
            
            if (isAcceptedMutation) {
              themeColor = "#be6447"; // active mutation
              badgeText = "MUTATION COMMITTED";
            } else if (event.status === "missing") {
              themeColor = "#555555";
              badgeText = "MISSING ANCESTOR";
            } else if (event.status === "loop_detected") {
              themeColor = "#555555";
              badgeText = "LOOP ENCOUNTERED";
            } else if (event.status === "depth_limit") {
              themeColor = "#555555";
              badgeText = "BOUNDARY LIMIT";
            }

            return (
              <div key={event.id || idx} className="flex flex-col items-center">
                
                {/* Visual Connector Strand */}
                {idx > 0 && (
                  <div className="flex flex-col items-center my-0.5">
                    <div 
                      className="w-0.5 h-6 transition-all" 
                      style={{ 
                        backgroundImage: `linear-gradient(to bottom, ${chain[idx-1].type === "AUTODISCO_MUTATION_ACCEPTED" ? "#be6447" : "#64abbe"} 0%, ${themeColor} 100%)`,
                        opacity: 0.6
                      }} 
                    />
                    <ArrowDown className="h-3 w-3 -mt-1 opacity-60" style={{ color: themeColor }} />
                  </div>
                )}

                {/* Event Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="w-full bg-[#141311] border p-4 shadow-sm space-y-3 transition-all relative overflow-hidden group"
                  style={{ 
                    borderColor: `${themeColor}40`,
                    boxShadow: `0 0 10px ${themeColor}05`
                  }}
                >
                  {/* Color Glow Left Indicator */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1" 
                    style={{ backgroundColor: themeColor }}
                  />

                  {/* Top line with Node + Badge info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-1.5 pl-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono text-[9px] font-extrabold px-2 py-0.5 uppercase text-stone-900"
                        style={{ backgroundColor: themeColor }}
                      >
                        {badgeText}
                      </span>
                      {event.mode && (
                        <span className="bg-stone-900 border border-stone-800 text-stone-400 font-mono text-[8px] px-1.5 py-0.5 uppercase tracking-wider">
                          {event.mode}
                        </span>
                      )}
                    </div>
                    
                    {event.hop !== null && (
                      <span className="text-[9px] font-mono text-[#abbe64] uppercase font-bold">
                        HOP {event.hop}
                      </span>
                    )}
                  </div>

                  {/* Core detail summary text */}
                  <div className="pl-2 space-y-1">
                    {event.status === "resolved" ? (
                      <>
                        <h4 className="font-mono text-[11px] font-bold text-stone-300">
                          {event.type}
                        </h4>
                        <p className="font-serif italic text-xs text-[#FAF8F5]/90 leading-relaxed whitespace-pre-wrap">
                          &ldquo;{event.summary}&rdquo;
                        </p>
                      </>
                    ) : (
                      <div className="space-y-1.5 py-1">
                        <span className="font-mono text-[10px] uppercase font-extrabold tracking-widest text-[#555555] flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {event.status === "missing" && "Parent receipt unavailable"}
                          {event.status === "loop_detected" && "Lineage loop detected; traversal stopped"}
                          {event.status === "depth_limit" && "Depth boundary reached; further ancestry not loaded"}
                        </span>
                        <p className="text-xs text-stone-500 font-serif italic">
                          {event.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions row (only for resolved) */}
                  {event.status === "resolved" && (
                    <div className="pl-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono border-t border-stone-900 pt-2.5">
                      <div className="space-y-1 text-stone-400">
                        {event.nodeName && (
                          <div className="truncate">
                            <span className="text-stone-600 font-bold uppercase mr-1">Witness Node:</span>
                            <span className="text-stone-300 uppercase">{event.nodeName}</span>
                          </div>
                        )}
                        {event.originNode && event.originNode !== event.nodeName && (
                          <div className="truncate">
                            <span className="text-stone-600 font-bold uppercase mr-1">Origin Seed:</span>
                            <span className="text-stone-300 uppercase">{event.originNode}</span>
                          </div>
                        )}
                        {event.createdAt && (
                          <div className="flex items-center gap-1 truncate">
                            <Clock className="h-3 w-3 text-stone-600" />
                            <span>{new Date(event.createdAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons list */}
                      <div className="flex flex-wrap gap-1.5 items-end justify-start sm:justify-end">
                        {event.traceId && (
                          <button
                            onClick={() => copyToClipboard(event.traceId || "", `trace-${event.id}`)}
                            className="bg-stone-900 border border-stone-800 hover:border-stone-700 px-2 py-1 text-[8px] font-mono text-stone-300 uppercase flex items-center gap-1 cursor-pointer transition-all"
                            title="Copy Federated Trace ID"
                          >
                            {copiedMap[`trace-${event.id}`] ? (
                              <>
                                <Check className="h-2.5 w-2.5 text-emerald-500" /> COPIED
                              </>
                            ) : (
                              <>
                                <Copy className="h-2.5 w-2.5" /> TRACE
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => copyToClipboard(event.ledgerUri, `uri-${event.id}`)}
                          className="bg-stone-900 border border-stone-800 hover:border-stone-700 px-2 py-1 text-[8px] font-mono text-stone-300 uppercase flex items-center gap-1 cursor-pointer transition-all"
                          title="Copy Ledger URI (not externally browsable)"
                        >
                          {copiedMap[`uri-${event.id}`] ? (
                            <>
                              <Check className="h-2.5 w-2.5 text-emerald-500" /> COPIED
                            </>
                          ) : (
                            <>
                              <Link className="h-2.5 w-2.5" /> LEDGER URI
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setActiveReceiptId(activeReceiptId === event.id ? null : event.id);
                          }}
                          className="bg-stone-900 border border-stone-800 hover:border-stone-700 px-2 py-1 text-[8px] font-mono text-stone-300 uppercase flex items-center gap-1 cursor-pointer transition-all hover:text-white"
                        >
                          <Database className="h-2.5 w-2.5" /> RECEIPT
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Local receipt inspector panel */}
                  {activeReceiptId === event.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-stone-950/60 p-3 border border-stone-800 rounded-none font-mono text-[8px] space-y-2 text-stone-400 mt-2 pl-2"
                    >
                      <div className="flex justify-between items-center text-[7px] border-b border-stone-900 pb-1 text-stone-500 uppercase tracking-widest font-extrabold">
                        <span>Ledger Receipt Spec</span>
                        <span className="text-emerald-500">Witnessed</span>
                      </div>
                      <div className="space-y-1 select-all break-all leading-normal">
                        <div><strong className="text-stone-500">URI:</strong> {event.ledgerUri}</div>
                        <div><strong className="text-stone-500">EVENT_ID:</strong> {event.id}</div>
                        <div><strong className="text-stone-500">PARENT_ID:</strong> {event.parentEventId || "N/A (ROOT)"}</div>
                        <div><strong className="text-stone-500">TRACE_ID:</strong> {event.traceId || "N/A"}</div>
                      </div>
                      <p className="text-[7px] italic text-stone-600 leading-normal">
                        Note: ledger:// protocols specify cryptographic receipts inside the Supabase Witness Web network. They are queried internally, not via standard browsers.
                      </p>
                    </motion.div>
                  )}

                </motion.div>
              </div>
            );
          })}

        </div>
      )}

      {/* Special footer info for loops and caps */}
      {!loading && !error && chain.length > 0 && (
        <div className="mt-6 border-t border-stone-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-mono text-stone-500 uppercase">
          <div className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-[#abbe64]" />
            <span>Shared Witness Ledger Sync Active</span>
          </div>
          <div>
            <span>Chain Length: {chain.length} hops</span>
          </div>
        </div>
      )}

    </div>
  );
};
