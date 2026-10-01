import React, { useMemo, useState } from "react";
import { Clipboard, Inbox, RadioTower, ShieldCheck } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";

type AssemblyResult = {
  state: "STATION_PACKET_ASSEMBLED";
  receiptUri: string;
  eventId: string;
  broadcastStatus: "NOT_BROADCAST";
  packet: unknown;
};

export default function StationInboxView() {
  const [releaseReceipt, setReleaseReceipt] = useState("");
  const [assembling, setAssembling] = useState(false);
  const [result, setResult] = useState<AssemblyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sourceId = useMemo(() => parseLedgerEventId(releaseReceipt), [releaseReceipt]);

  async function assemble() {
    if (!sourceId) return;

    setAssembling(true);
    setError(null);
    setResult(null);

    try {
      const response = await ownerFetch("/api/station-packets/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseReceipt }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Station packet assembly failed.");
      }

      setResult(data as AssemblyResult);
    } catch (err: any) {
      setError(err.message || "Station packet assembly failed.");
    } finally {
      setAssembling(false);
    }
  }

  async function copyPacket() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result.packet, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#F27D26]" />
              Station Inbox
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              admitted release → bounded station packet
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {result ? "STATION PACKET ASSEMBLED" : sourceId ? "RELEASE RECEIPT READY" : "AWAITING RELEASE RECEIPT"}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Release receipt URI or UUID
            </label>
            <input
              value={releaseReceipt}
              onChange={(event) => {
                setReleaseReceipt(event.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder="ledger://events/..."
              className="mt-2 w-full border border-[#141414] bg-white p-3 font-mono text-[10px] text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
            />
            {!sourceId && releaseReceipt.trim() && (
              <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-red-700">
                Not a valid ledger event UUID or ledger://events/&lt;uuid&gt; URI.
              </p>
            )}
          </div>

          <aside className="space-y-3">
            <div className="border border-[#141414] bg-white p-3">
              <p className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest">
                <ShieldCheck className="h-3.5 w-3.5" />
                Gate promise
              </p>
              <div className="mt-2 space-y-1 text-[9px] font-mono uppercase tracking-wide text-stone-600">
                <p>release receipt required</p>
                <p>permissions preserved exactly</p>
                <p>no voice synthesis</p>
                <p>no training</p>
                <p>no playlist insertion</p>
                <p>no broadcast</p>
              </div>
            </div>

            <button
              onClick={() => void assemble()}
              disabled={!sourceId || assembling}
              className="w-full border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {assembling ? "Assembling…" : "Assemble station packet"}
            </button>
          </aside>
        </div>
      </section>

      {error && (
        <section className="border-2 border-red-700 bg-red-50 p-4 font-mono text-[10px] text-red-800">
          {error}
        </section>
      )}

      {result && (
        <section className="border-2 border-[#141414] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest">
                <RadioTower className="h-4 w-4 text-[#F27D26]" />
                Station packet assembled
              </h3>
              <p className="mt-1 break-all font-mono text-[9px] text-stone-600">{result.receiptUri}</p>
            </div>
            <span className="border border-[#F27D26] px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-[#F27D26]">
              {result.broadcastStatus}
            </span>
          </div>

          <pre className="mt-4 max-h-[28rem] overflow-auto border border-[#141414] bg-[#E4E3E0] p-3 text-[9px] leading-relaxed text-[#141414]">
            {JSON.stringify(result.packet, null, 2)}
          </pre>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[9px] uppercase tracking-wide text-stone-600">
              Prepared for a later listening/broadcast crossing. Nothing has aired.
            </p>
            <button
              onClick={() => void copyPacket()}
              className="inline-flex items-center gap-1 border border-[#141414] px-2 py-1 font-mono text-[9px] uppercase tracking-widest"
            >
              <Clipboard className="h-3 w-3" /> {copied ? "Copied" : "Copy packet"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
