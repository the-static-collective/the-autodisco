import React, { useMemo, useState } from "react";
import { Clipboard, Mail, PackageCheck } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";
import type { ListenerReturnKind, ListenerReturnPacket } from "../lib/listenerReturn";

type ListenerReturnResult = {
  state: "LISTENER_RETURN_CAPTURED";
  receiptUri: string;
  packet: ListenerReturnPacket;
  releaseStatus: "UNRELEASED";
  replayedExistingReceipt: boolean;
};

export default function ListenerReturnView() {
  const [broadcastReceipt, setBroadcastReceipt] = useState("");
  const [listenerLabel, setListenerLabel] = useState("");
  const [responseKind, setResponseKind] = useState<ListenerReturnKind>("TEXT");
  const [text, setText] = useState("");
  const [artifactSha256, setArtifactSha256] = useState("");
  const [filename, setFilename] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [result, setResult] = useState<ListenerReturnResult | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const broadcastId = useMemo(
    () => parseLedgerEventId(broadcastReceipt),
    [broadcastReceipt],
  );

  async function capture() {
    if (!broadcastId || !listenerLabel.trim() || !capturedAt.trim()) return;

    setWorking(true);
    setResult(null);
    setError(null);

    try {
      const response = await ownerFetch("/api/listener-return/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broadcastReceipt,
          listenerLabel: listenerLabel.trim(),
          responseKind,
          text,
          artifactSha256: artifactSha256.trim(),
          filename: filename.trim(),
          capturedAt: capturedAt.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.errors?.join(" · ") ||
            data?.error ||
            "Could not capture Listener Return.",
        );
      }

      setResult(data as ListenerReturnResult);
    } catch (err: any) {
      setError(err.message || "Could not capture Listener Return.");
    } finally {
      setWorking(false);
    }
  }

  async function copyPacket() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result.packet, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function exportPacket() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.packet, null, 2) + "\n"], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "listener-return-001.json";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Mail className="h-4 w-4 text-[#F27D26]" />
              Listener Return 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              actual broadcast → human response → RETURN ADDRESS packet
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {result ? "MAIL READY" : "AWAITING HUMAN RETURN"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Broadcast receipt *
            </span>
            <input
              value={broadcastReceipt}
              onChange={(event) => {
                setBroadcastReceipt(event.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder="ledger://events/<actual-broadcast-receipt>"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Listener attribution *
            </span>
            <input
              value={listenerLabel}
              onChange={(event) => setListenerLabel(event.target.value)}
              placeholder="human-readable name / label"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Captured at *
            </span>
            <input
              value={capturedAt}
              onChange={(event) => setCapturedAt(event.target.value)}
              placeholder="2026-10-01T16:18:00-05:00"
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            />
          </label>

          <label>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Response kind *
            </span>
            <select
              value={responseKind}
              onChange={(event) => {
                const next = event.target.value as ListenerReturnKind;
                setResponseKind(next);
                setResult(null);
              }}
              className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
            >
              <option value="TEXT">TEXT</option>
              <option value="AUDIO">AUDIO REFERENCE</option>
            </select>
          </label>

          {responseKind === "AUDIO" && (
            <label>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                Filename
              </span>
              <input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                placeholder="optional-return-message.wav"
                className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
              />
            </label>
          )}

          {responseKind === "TEXT" ? (
            <label className="md:col-span-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                Verbatim human response *
              </span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={9}
                placeholder="Preserved exactly. No sentiment score, summary, or interpretation is added."
                className="mt-1 w-full border border-[#141414] bg-white p-3 font-mono text-[10px] leading-relaxed"
              />
            </label>
          ) : (
            <label className="md:col-span-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                Audio artifact SHA-256 *
              </span>
              <input
                value={artifactSha256}
                onChange={(event) => setArtifactSha256(event.target.value)}
                placeholder="64 hex characters"
                className="mt-1 w-full border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
              />
              <p className="mt-1 font-mono text-[8px] uppercase tracking-wide text-stone-600">
                Reference only · no transcript · no voice-license inference
              </p>
            </label>
          )}
        </div>

        <button
          onClick={() => void capture()}
          disabled={
            !broadcastId ||
            !listenerLabel.trim() ||
            !capturedAt.trim() ||
            working ||
            (responseKind === "TEXT" && !text.trim()) ||
            (responseKind === "AUDIO" && !artifactSha256.trim())
          }
          className="mt-4 w-full border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
        >
          {working ? "Capturing…" : "Shove mail in slot"}
        </button>
      </section>

      {result && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            <PackageCheck className="h-4 w-4" />
            RETURN ADDRESS packet ready
          </h3>

          <p className="mt-2 break-all font-mono text-[8px] text-emerald-900">
            receipt · {result.receiptUri}
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            UNRELEASED · semantic_effect: none · correspondence only
          </p>

          <pre className="mt-3 max-h-[30rem] overflow-auto border border-emerald-700 bg-white p-3 font-mono text-[9px] leading-relaxed text-[#141414]">
            {JSON.stringify(result.packet, null, 2)}
          </pre>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void copyPacket()}
              className="inline-flex items-center gap-1 border border-emerald-800 bg-white px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-900"
            >
              <Clipboard className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy packet"}
            </button>
            <button
              onClick={exportPacket}
              className="border border-emerald-800 bg-white px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-900"
            >
              Export JSON
            </button>
          </div>

          <p className="mt-3 font-mono text-[8px] uppercase tracking-wide text-emerald-800">
            No direct Groove Rooms write occurred. This packet may be carried there manually.
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
