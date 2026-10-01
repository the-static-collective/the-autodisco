import React, { useMemo, useState } from "react";
import { CheckCircle, RadioTower, ShieldAlert } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";
import type { BroadcastCompletion } from "../lib/broadcastReceipt";

type BroadcastResult = {
  state: "BROADCAST_RECORDED";
  receiptUri: string;
  replayedExistingReceipt: boolean;
  broadcast: {
    source_kind: "ORIGINAL_HUMAN" | "RENDERED";
    source_receipt_uri: string;
    station_receipt_uri: string;
    release_receipt_uri: string;
    source_audio_sha256: string;
    audio_sha256: string;
    airing: {
      station: string;
      show: string | null;
      slot: string | null;
      started_at: string;
      completed_at: string | null;
      completion: BroadcastCompletion;
      aired_duration_ms: number | null;
    };
    broadcast_status: "BROADCAST_RECORDED";
    endorsement_status: "NOT_INFERRED";
  };
};

export default function BroadcastReceiptView() {
  const [sourceReceipt, setSourceReceipt] = useState("");
  const [station, setStation] = useState("");
  const [show, setShow] = useState("");
  const [slot, setSlot] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [completion, setCompletion] = useState<BroadcastCompletion>("COMPLETE");
  const [airedAudioSha256, setAiredAudioSha256] = useState("");
  const [airedDurationMs, setAiredDurationMs] = useState("");
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceId = useMemo(() => parseLedgerEventId(sourceReceipt), [sourceReceipt]);
  const partial = completion === "PARTIAL" || completion === "INTERRUPTED";

  async function recordBroadcast() {
    if (!sourceId || !station.trim() || !startedAt.trim()) return;

    setWorking(true);
    setResult(null);
    setError(null);

    try {
      const response = await ownerFetch("/api/broadcast-receipts/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceReceipt,
          station: station.trim(),
          show: show.trim(),
          slot: slot.trim(),
          startedAt: startedAt.trim(),
          completedAt: completedAt.trim(),
          completion,
          airedAudioSha256: airedAudioSha256.trim(),
          airedDurationMs: airedDurationMs.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Could not record broadcast.");
      }

      setResult(data as BroadcastResult);
    } catch (err: any) {
      setError(err.message || "Could not record broadcast.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <RadioTower className="h-4 w-4 text-[#F27D26]" />
              Broadcast Receipt 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              eligible audio → actual airing occurrence → immutable receipt
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {result ? "BROADCAST RECORDED" : "AWAITING OCCURRENCE"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Eligible audio receipt</span>
            <input
              value={sourceReceipt}
              onChange={(event) => {
                setSourceReceipt(event.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder="ledger://events/<station-packet-or-rendered-audio>"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Station *</span>
            <input
              value={station}
              onChange={(event) => setStation(event.target.value)}
              placeholder="station / stream / channel label"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Show</span>
            <input
              value={show}
              onChange={(event) => setShow(event.target.value)}
              placeholder="optional show"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Slot</span>
            <input
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
              placeholder="optional slot / position"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Completion *</span>
            <select
              value={completion}
              onChange={(event) => {
                setCompletion(event.target.value as BroadcastCompletion);
                setResult(null);
              }}
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            >
              <option value="COMPLETE">COMPLETE</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="INTERRUPTED">INTERRUPTED</option>
            </select>
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Started at *</span>
            <input
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
              placeholder="2026-10-01T20:30:00-05:00"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Completed at {completion === "COMPLETE" ? "*" : ""}
            </span>
            <input
              value={completedAt}
              onChange={(event) => setCompletedAt(event.target.value)}
              placeholder="2026-10-01T20:31:15-05:00"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          {partial && (
            <>
              <label>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                  Exact aired-bytes SHA-256 *
                </span>
                <input
                  value={airedAudioSha256}
                  onChange={(event) => setAiredAudioSha256(event.target.value)}
                  placeholder="64 hex characters"
                  className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
                />
              </label>

              <label>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                  Aired duration ms *
                </span>
                <input
                  value={airedDurationMs}
                  onChange={(event) => setAiredDurationMs(event.target.value)}
                  inputMode="numeric"
                  placeholder="milliseconds actually aired"
                  className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
                />
              </label>
            </>
          )}
        </div>

        <button
          onClick={() => void recordBroadcast()}
          disabled={
            !sourceId ||
            !station.trim() ||
            !startedAt.trim() ||
            working ||
            (completion === "COMPLETE" && !completedAt.trim()) ||
            (partial && (!airedAudioSha256.trim() || !airedDurationMs.trim()))
          }
          className="mt-4 w-full border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
        >
          {working ? "Recording occurrence…" : "Record actual airing"}
        </button>

        <div className="mt-3 border border-[#141414] bg-white p-3">
          <p className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest">
            <ShieldAlert className="h-3.5 w-3.5 text-[#F27D26]" />
            Truth boundary
          </p>
          <p className="mt-1 font-mono text-[9px] leading-relaxed text-stone-600">
            This form records something that actually aired. Scheduling, rendering, release, or station eligibility are not enough.
            Partial/interrupted airings need the hash and duration of the bytes actually heard.
          </p>
        </div>
      </section>

      {result && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            Broadcast occurrence recorded
          </h3>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="border border-emerald-700 bg-white p-2">
              <p className="font-mono text-[8px] uppercase text-emerald-700">source kind</p>
              <p className="mt-1 font-mono text-[9px]">{result.broadcast.source_kind}</p>
            </div>
            <div className="border border-emerald-700 bg-white p-2">
              <p className="font-mono text-[8px] uppercase text-emerald-700">completion</p>
              <p className="mt-1 font-mono text-[9px]">{result.broadcast.airing.completion}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1 break-all font-mono text-[8px] text-emerald-900">
            <p>receipt · {result.receiptUri}</p>
            <p>source · {result.broadcast.source_receipt_uri}</p>
            <p>station · {result.broadcast.station_receipt_uri}</p>
            <p>release · {result.broadcast.release_receipt_uri}</p>
            <p>source audio sha256 · {result.broadcast.source_audio_sha256}</p>
            <p>aired audio sha256 · {result.broadcast.audio_sha256}</p>
          </div>

          <p className="mt-3 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            BROADCAST_RECORDED · ENDORSEMENT NOT INFERRED
            {result.replayedExistingReceipt ? " · existing receipt replayed" : ""}
          </p>
        </section>
      )}

      {error && (
        <section className="border-2 border-red-700 bg-red-50 p-4 font-mono text-[10px] text-red-800">
          {error}
        </section>
      )}
    </div>
  );
}
